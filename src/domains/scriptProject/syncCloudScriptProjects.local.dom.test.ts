import { afterEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get }
}));

import {
  cancelCloudProjectCatalogSync,
  cancelCloudProjectSync,
  deferCloudProjectCatalogSync,
  getCloudProjectSyncStatus,
  getCloudProjectCatalogSyncProgress,
  subscribeCloudProjectCatalogSyncProgress,
  subscribeCloudAssetReady,
  subscribeCloudProjectMetadata,
  subscribeCloudProjectSyncStatus,
  syncCloudProject,
  syncCloudScriptProject,
  syncCloudScriptProjects
} from "./syncCloudScriptProjects.local";

const project = {
  id: "script-1",
  name: "Recovered project",
  description: "",
  active: true,
  type: "script_to_shots",
  settings: {}
};

const installCloudBridge = () => {
  const put = vi.fn().mockResolvedValue(undefined);
  const mirrorCloud = vi.fn().mockResolvedValue(true);
  const cancelCloudMirror = vi.fn().mockResolvedValue(undefined);
  const cacheCloudAsset = vi.fn().mockResolvedValue(true);
  const getLocalProject = vi.fn().mockResolvedValue(null);
  const getLocalAsset = vi.fn().mockResolvedValue(null);
  const getScriptProjectSnapshot = vi.fn().mockResolvedValue(null);
  const cacheMedia = vi.fn().mockResolvedValue(undefined);
  const cancelMedia = vi.fn().mockResolvedValue(undefined);
  const listLocalProjects = vi.fn().mockResolvedValue([]);
  const deleteLocalProject = vi.fn().mockResolvedValue(undefined);
  const getCloudLink = vi.fn().mockResolvedValue(null);
  const patchCloudLink = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("mago", {
    account: { mode: "cloud" },
    assets: { get: getLocalAsset },
    cloud: { links: { get: getCloudLink, patch: patchCloudLink } },
    projects: {
      mirrorCloud,
      cancelCloudMirror,
      cacheCloudAsset,
      get: getLocalProject,
      list: listLocalProjects,
      delete: deleteLocalProject
    },
    scriptProjects: {
      put,
      get: getScriptProjectSnapshot,
      cacheMedia,
      cancelMedia
    }
  });
  return {
    mirrorCloud,
    cancelCloudMirror,
    cacheCloudAsset,
    getLocalAsset,
    getLocalProject,
    getScriptProjectSnapshot,
    put,
    cacheMedia,
    cancelMedia,
    listLocalProjects,
    deleteLocalProject
  };
};

const mockProjectReads = () => {
  get.mockImplementation((url: string) => {
    if (url === "/projects/script-1") return Promise.resolve({ data: project });
    if (url === "/projects/script-1/state") {
      return Promise.resolve({
        data: { project_id: "script-1", keys: [], shots: [] }
      });
    }
    if (url === "/projects/script-1/script") {
      return Promise.resolve({ data: { active_version: null, versions: [] } });
    }
    if (url === "/projects/script-1/cut") {
      return Promise.resolve({
        data: { project_id: "script-1", shots: [], missing: [], export: null }
      });
    }
    throw new Error(`Unexpected URL: ${url}`);
  });
};

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("cloud script-project synchronization", () => {
  it("publishes longform metadata before blocked media and downloads videos sequentially", async () => {
    const { put, cacheMedia } = installCloudBridge();
    mockProjectReads();
    const defaultRead = get.getMockImplementation()!;
    const videoUrls = [
      "https://storage.example/first.mp4",
      "https://storage.example/second.mp4"
    ];
    get.mockImplementation((url: string, ...args: unknown[]) => {
      if (url === "/projects/script-1/cut")
        return Promise.resolve({
          data: {
            project_id: "script-1",
            shots: videoUrls.map((videoUrl, index) => ({
              timeline_id: `timeline-${index}`,
              shot_index: index,
              sequence_id: index,
              asset_id: `longform-${index}`,
              url: videoUrl
            })),
            missing: [],
            export: null
          }
        });
      return defaultRead(url, ...args);
    });
    let finishFirst!: () => void;
    cacheMedia.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishFirst = resolve;
        })
    );
    const synchronization = syncCloudScriptProject("script-1");
    await vi.waitFor(() => expect(cacheMedia).toHaveBeenCalledOnce());
    expect(put).toHaveBeenCalledWith(
      expect.objectContaining({
        metadataOnly: true,
        cut: expect.objectContaining({ shots: expect.any(Array) })
      })
    );
    expect(cacheMedia).toHaveBeenLastCalledWith("script-1", videoUrls[0]);
    finishFirst();
    await synchronization;
    expect(cacheMedia).toHaveBeenNthCalledWith(2, "script-1", videoUrls[1]);
  });
  it("publishes background synchronization status", async () => {
    let finishListRequest!: (value: { data: { items: never[] } }) => void;
    get.mockReturnValue(
      new Promise((resolve) => {
        finishListRequest = resolve;
      })
    );
    installCloudBridge();
    const statuses: boolean[] = [];
    const unsubscribe = subscribeCloudProjectSyncStatus(() => {
      statuses.push(getCloudProjectSyncStatus());
    });

    const synchronization = syncCloudScriptProjects();
    expect(getCloudProjectSyncStatus()).toBe(true);
    finishListRequest({ data: { items: [] } });
    await synchronization;

    expect(getCloudProjectSyncStatus()).toBe(false);
    expect(statuses).toEqual([true, false]);
    unsubscribe();
  });

  it("discovers old projects as metadata without hydrating every project", async () => {
    const { mirrorCloud, put } = installCloudBridge();
    mockProjectReads();
    get.mockImplementationOnce((url: string) => {
      expect(url).toBe("/projects/homepage/list");
      return Promise.resolve({
        data: {
          items: [{ id: "script-1", type: "script_to_shots" }]
        }
      });
    });

    await syncCloudScriptProjects();

    expect(get).toHaveBeenCalledWith("/projects/homepage/list", {
      signal: expect.any(AbortSignal),
      params: {
        page: 1,
        per_page: -1,
        sort_by: "updated_at",
        sort_order: "desc"
      }
    });
    expect(mirrorCloud).toHaveBeenCalledWith({
      project: { id: "script-1", type: "script_to_shots" },
      includeContent: false
    });
    expect(put).not.toHaveBeenCalled();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("removes an imported Cloud Mirror Project once the catalog stops listing it", async () => {
    const { listLocalProjects, deleteLocalProject } = installCloudBridge();
    listLocalProjects.mockResolvedValue([
      { id: "cloud-1", name: "Real cloud project", origin: "cloud" },
      { id: "mirror-1", name: "Mirror", origin: "cloud" }
    ]);
    get.mockImplementation((url: string) => {
      if (url === "/projects/homepage/list") {
        return Promise.resolve({ data: { items: [{ id: "cloud-1" }] } });
      }
      if (url === "/projects/mirror-1") {
        return Promise.resolve({
          data: { settings: { mirroredLocalProjectId: "local-1" } }
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    await syncCloudScriptProjects();

    expect(deleteLocalProject).toHaveBeenCalledOnce();
    expect(deleteLocalProject).toHaveBeenCalledWith("mirror-1");
  });

  it("stops catalog writes when project navigation takes priority", async () => {
    const { mirrorCloud } = installCloudBridge();
    get.mockResolvedValue({
      data: {
        items: [
          { id: "cloud-1", type: "timeline" },
          { id: "cloud-2", type: "timeline" }
        ]
      }
    });
    let finishFirstWrite!: () => void;
    mirrorCloud.mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          finishFirstWrite = () => resolve(true);
        })
    );

    const synchronization = syncCloudScriptProjects();
    await vi.waitFor(() => expect(mirrorCloud).toHaveBeenCalledTimes(1));
    cancelCloudProjectCatalogSync();
    finishFirstWrite();
    await synchronization;

    expect(mirrorCloud).toHaveBeenCalledTimes(1);
    expect(getCloudProjectSyncStatus()).toBe(false);
    expect(getCloudProjectCatalogSyncProgress()).toBeNull();
  });

  it("resumes a deferred catalog refresh in the background", async () => {
    vi.useFakeTimers();
    installCloudBridge();
    get.mockResolvedValue({ data: { items: [] } });

    await syncCloudScriptProjects();
    deferCloudProjectCatalogSync();
    expect(get).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1500);
    await vi.waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(getCloudProjectSyncStatus()).toBe(false);
  });

  it("does not start script detail requests from the homepage catalog", async () => {
    const { mirrorCloud, put } = installCloudBridge();
    get.mockImplementation((url: string) => {
      if (url === "/projects/homepage/list") {
        return Promise.resolve({
          data: { items: [{ id: "script-1", type: "script_to_shots" }] }
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    await syncCloudScriptProjects();

    expect(mirrorCloud).toHaveBeenCalledWith({
      project: { id: "script-1", type: "script_to_shots" },
      includeContent: false
    });
    expect(put).not.toHaveBeenCalled();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("does not queue later catalog writes behind an in-progress mirror", async () => {
    const progress: Array<
      ReturnType<typeof getCloudProjectCatalogSyncProgress>
    > = [];
    const unsubscribe = subscribeCloudProjectCatalogSyncProgress(() =>
      progress.push(getCloudProjectCatalogSyncProgress())
    );
    let finishFirstMirror!: (accepted: boolean) => void;
    const { mirrorCloud } = installCloudBridge();
    mirrorCloud
      .mockImplementationOnce(
        () =>
          new Promise<boolean>((resolve) => {
            finishFirstMirror = resolve;
          })
      )
      .mockResolvedValue(true);
    get.mockResolvedValue({
      data: {
        items: [
          { id: "project-1", type: "timeline" },
          { id: "project-2", type: "timeline" }
        ]
      }
    });

    const synchronization = syncCloudScriptProjects();
    await vi.waitFor(() => expect(mirrorCloud).toHaveBeenCalledTimes(1));
    expect(getCloudProjectCatalogSyncProgress()).toEqual({
      completed: 0,
      total: 2
    });
    expect(mirrorCloud).toHaveBeenLastCalledWith({
      project: { id: "project-1", type: "timeline" },
      includeContent: false
    });

    finishFirstMirror(true);
    await synchronization;
    expect(progress).toEqual([
      { completed: 0, total: 2 },
      { completed: 1, total: 2 },
      { completed: 2, total: 2 },
      null
    ]);
    unsubscribe();

    expect(mirrorCloud).toHaveBeenCalledTimes(2);
    expect(mirrorCloud).toHaveBeenLastCalledWith({
      project: { id: "project-2", type: "timeline" },
      includeContent: false
    });
  });

  it("can repair one missing mirror when its project is opened directly", async () => {
    const { put } = installCloudBridge();
    mockProjectReads();

    await syncCloudScriptProject("script-1");

    expect(get).toHaveBeenCalledWith("/projects/script-1", {
      signal: expect.any(AbortSignal)
    });
    expect(put).toHaveBeenCalledWith({
      projectId: "script-1",
      project
    });
  });

  it("publishes again after the fetched project snapshot is committed", async () => {
    installCloudBridge();
    mockProjectReads();
    const updates: string[] = [];
    const unsubscribe = subscribeCloudProjectMetadata((projectId) => {
      updates.push(projectId);
    });

    await syncCloudScriptProject("script-1");

    expect(updates).toEqual(["script-1", "script-1", "script-1", "script-1"]);
    unsubscribe();
  });

  const mockProjectReadsWithPlans = ({
    listedPlanIds,
    unreachablePlanIds
  }: {
    listedPlanIds: string[];
    unreachablePlanIds: string[];
  }) => {
    get.mockImplementation((url: string) => {
      if (url === "/projects/script-1")
        return Promise.resolve({ data: project });
      if (url === "/projects/script-1/state") {
        return Promise.resolve({
          data: { project_id: "script-1", keys: [], shots: [] }
        });
      }
      if (url === "/projects/script-1/script") {
        return Promise.resolve({
          data: {
            active_version: 1,
            versions: listedPlanIds.map((planId, index) => ({
              version: index + 1,
              plan_id: planId
            }))
          }
        });
      }
      if (url === "/projects/script-1/cut") {
        return Promise.resolve({
          data: { project_id: "script-1", shots: [], missing: [], export: null }
        });
      }
      const planId = url.replace("/agent/plans/", "");
      if (unreachablePlanIds.includes(planId)) {
        return Promise.reject(new Error("Network unreachable"));
      }
      if (listedPlanIds.includes(planId)) {
        return Promise.resolve({ data: { id: planId, status: "fresh" } });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
  };

  it("keeps the cached copy of a plan whose re-sync fetch failed", async () => {
    const { put, getScriptProjectSnapshot } = installCloudBridge();
    getScriptProjectSnapshot.mockResolvedValue({
      state: null,
      scriptVersions: null,
      cut: null,
      planDetails: {
        "plan-a": { id: "plan-a", status: "cached" },
        "plan-b": { id: "plan-b", status: "cached" }
      }
    });
    mockProjectReadsWithPlans({
      listedPlanIds: ["plan-a", "plan-b"],
      unreachablePlanIds: ["plan-a"]
    });

    await syncCloudScriptProject("script-1");

    expect(put).toHaveBeenLastCalledWith(
      expect.objectContaining({
        projectId: "script-1",
        planDetails: {
          "plan-a": { id: "plan-a", status: "cached" },
          "plan-b": { id: "plan-b", status: "fresh" }
        }
      })
    );
  });

  it("drops cached plans the cloud script listing no longer references", async () => {
    const { put, getScriptProjectSnapshot } = installCloudBridge();
    getScriptProjectSnapshot.mockResolvedValue({
      state: null,
      scriptVersions: null,
      cut: null,
      planDetails: {
        "plan-a": { id: "plan-a", status: "cached" },
        "plan-deleted": { id: "plan-deleted", status: "cached" }
      }
    });
    mockProjectReadsWithPlans({
      listedPlanIds: ["plan-a"],
      unreachablePlanIds: ["plan-a"]
    });

    await syncCloudScriptProject("script-1");

    expect(put).toHaveBeenLastCalledWith(
      expect.objectContaining({
        planDetails: { "plan-a": { id: "plan-a", status: "cached" } }
      })
    );
  });

  it("clears cached plans when the cloud script listing has none", async () => {
    const { put } = installCloudBridge();
    mockProjectReadsWithPlans({ listedPlanIds: [], unreachablePlanIds: [] });

    await syncCloudScriptProject("script-1");

    expect(put).toHaveBeenLastCalledWith(
      expect.objectContaining({ planDetails: {} })
    );
  });

  it("adds ordinary cloud projects to the list without eagerly downloading them", async () => {
    const { mirrorCloud } = installCloudBridge();
    const timelineSummary = {
      id: "timeline-project-1",
      name: "Cloud timeline",
      type: "timeline",
      timeline_count: 3,
      total_renders: 2,
      total_img2img: 1,
      preview_url: "https://cdn.example/preview.jpg"
    };
    get.mockResolvedValue({ data: { items: [timelineSummary] } });

    await syncCloudScriptProjects();

    expect(mirrorCloud).toHaveBeenCalledWith({
      project: timelineSummary,
      includeContent: false
    });
    expect(get).toHaveBeenCalledTimes(1);
  });

  const timelineProjectWith = (
    shots: { timelineId: string; assetId: string }[]
  ) => ({
    id: "timeline-project-1",
    name: "Cloud timeline",
    description: "",
    active: true,
    type: "timeline",
    settings: {},
    timelines: shots.map(({ timelineId, assetId }) => ({
      id: timelineId,
      name: "Shot",
      project_id: "timeline-project-1",
      user_id: "cloud-user",
      settings: {},
      layers: [
        {
          id: `layer-${assetId}`,
          name: "Input",
          timeline_id: timelineId,
          project_id: "timeline-project-1",
          status: null,
          user_id: "cloud-user",
          type: "IMAGE",
          active: true,
          muted: false,
          visible: true,
          layer_order: 0,
          rating: 0,
          created_at: "2026-01-01T00:00:00Z",
          data: {},
          clips: [
            {
              id: `clip-${assetId}`,
              layer_id: `layer-${assetId}`,
              name: "source.mp4",
              asset_id: assetId,
              data: {},
              asset: {
                id: assetId,
                name: "source.mp4",
                filepath: "projects/source.mp4",
                type: "VIDEO",
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-01T00:00:00Z",
                origin: "uploaded",
                last_used: "2026-01-01T00:00:00Z",
                rate: 0,
                data: {}
              }
            }
          ]
        }
      ]
    }))
  });

  /** What the desktop library reports back after the metadata commit. */
  const localProjectWith = (
    shots: { timelineId: string; assetId: string; status: string }[]
  ) => ({
    id: "timeline-project-1",
    timelines: shots.map(({ timelineId, assetId, status }) => ({
      id: timelineId,
      layers: [
        {
          id: `layer-${assetId}`,
          clips: [
            {
              id: `clip-${assetId}`,
              asset_id: assetId,
              asset: { id: assetId, type: "VIDEO", data: { status } }
            }
          ]
        }
      ]
    }))
  });

  const assetDetail = (assetId: string) => ({
    data: {
      s3_url: `https://cdn.example/${assetId}.mp4`,
      thumbnail_url: `https://cdn.example/${assetId}.jpg`
    }
  });

  it("downloads each missing asset on its own, opened Shot first, and announces it", async () => {
    const { mirrorCloud, cacheCloudAsset, getLocalProject } =
      installCloudBridge();
    const shots = [
      { timelineId: "timeline-1", assetId: "asset-1" },
      { timelineId: "timeline-2", assetId: "asset-2" },
      { timelineId: "timeline-3", assetId: "asset-3" }
    ];
    const cloudProject = timelineProjectWith(shots);
    getLocalProject.mockResolvedValue(
      localProjectWith([
        { ...shots[0], status: "created" },
        { ...shots[1], status: "created" },
        { ...shots[2], status: "ingested" }
      ])
    );
    get.mockImplementation((url: string) => {
      if (url === "/projects/timeline-project-1") {
        return Promise.resolve({ data: cloudProject });
      }
      const assetId = /^\/assets\/(.+)$/.exec(url)?.[1];
      if (assetId) return Promise.resolve(assetDetail(assetId));
      throw new Error(`Unexpected URL: ${url}`);
    });
    const ready: string[] = [];
    const unsubscribe = subscribeCloudAssetReady((_projectId, assetId) =>
      ready.push(assetId)
    );

    await syncCloudProject("timeline-project-1", "timeline-2");
    unsubscribe();

    expect(mirrorCloud).toHaveBeenCalledTimes(1);
    expect(mirrorCloud).toHaveBeenCalledWith({
      project: cloudProject,
      includeContent: true
    });
    expect(get.mock.calls.map(([url]) => url)).toEqual([
      "/projects/timeline-project-1",
      "/assets/asset-2",
      "/assets/asset-1"
    ]);
    expect(cacheCloudAsset).toHaveBeenCalledWith({
      projectId: "timeline-project-1",
      assetId: "asset-2",
      isImage: false,
      sourceUrl: "https://cdn.example/asset-2.mp4",
      thumbnailUrl: "https://cdn.example/asset-2.jpg"
    });
    expect(ready.sort()).toEqual(["asset-1", "asset-2"]);
  });

  it("downloads a reference image that only appears in a render's sources", async () => {
    const { cacheCloudAsset, getLocalProject } = installCloudBridge();
    const cloudProject = timelineProjectWith([
      { timelineId: "timeline-1", assetId: "render-asset" }
    ]);
    const renderAsset = (
      cloudProject.timelines[0].layers[0].clips[0] as Record<string, unknown>
    ).asset as Record<string, unknown>;
    renderAsset.data = {
      data: {
        sources: {
          images: [{ asset_id: "cloud-reference", type: "reference_frame" }]
        },
        render_settings: { magov2: { image_ids: ["local-reference"] } }
      }
    };
    getLocalProject.mockResolvedValue(
      localProjectWith([
        {
          timelineId: "timeline-1",
          assetId: "render-asset",
          status: "ingested"
        }
      ])
    );
    get.mockImplementation((url: string) => {
      if (url === "/projects/timeline-project-1") {
        return Promise.resolve({ data: cloudProject });
      }
      if (url === "/assets/cloud-reference") {
        return Promise.resolve({
          data: {
            s3_url: "https://cdn.example/cloud-reference.png",
            thumbnail_url: "https://cdn.example/cloud-reference-thumb.jpg"
          }
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    await syncCloudProject("timeline-project-1");

    expect(cacheCloudAsset).toHaveBeenCalledWith({
      projectId: "timeline-project-1",
      assetId: "cloud-reference",
      isImage: true,
      sourceUrl: "https://cdn.example/cloud-reference.png",
      thumbnailUrl: "https://cdn.example/cloud-reference-thumb.jpg"
    });
    expect(get).not.toHaveBeenCalledWith(
      "/assets/local-reference",
      expect.anything()
    );
  });

  it("does not announce an asset whose download failed and keeps going", async () => {
    const { cacheCloudAsset, getLocalProject } = installCloudBridge();
    const shots = [
      { timelineId: "timeline-1", assetId: "asset-1" },
      { timelineId: "timeline-1", assetId: "asset-2" }
    ];
    getLocalProject.mockResolvedValue(
      localProjectWith(shots.map((shot) => ({ ...shot, status: "created" })))
    );
    cacheCloudAsset.mockImplementation(({ assetId }: { assetId: string }) =>
      assetId === "asset-1"
        ? Promise.reject(new Error("offline"))
        : Promise.resolve(true)
    );
    get.mockImplementation((url: string) => {
      if (url === "/projects/timeline-project-1") {
        return Promise.resolve({ data: timelineProjectWith(shots) });
      }
      const assetId = /^\/assets\/(.+)$/.exec(url)?.[1];
      if (assetId) return Promise.resolve(assetDetail(assetId));
      throw new Error(`Unexpected URL: ${url}`);
    });
    const ready: string[] = [];
    const unsubscribe = subscribeCloudAssetReady((_projectId, assetId) =>
      ready.push(assetId)
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await syncCloudProject("timeline-project-1");
    unsubscribe();

    expect(ready).toEqual(["asset-2"]);
  });

  it("commits timeline metadata before waiting for asset URLs", async () => {
    const { mirrorCloud, cacheCloudAsset, getLocalProject } =
      installCloudBridge();
    const shots = [{ timelineId: "timeline-1", assetId: "asset-1" }];
    const cloudProject = timelineProjectWith(shots);
    getLocalProject.mockResolvedValue(
      localProjectWith([{ ...shots[0], status: "created" }])
    );
    let resolveAsset!: (value: { data: Record<string, unknown> }) => void;
    get.mockImplementation((url: string) => {
      if (url === "/projects/timeline-project-1") {
        return Promise.resolve({ data: cloudProject });
      }
      if (url === "/assets/asset-1") {
        return new Promise((resolve) => {
          resolveAsset = resolve;
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const synchronization = syncCloudProject(
      "timeline-project-1",
      "timeline-1"
    );
    await vi.waitFor(() => {
      expect(mirrorCloud).toHaveBeenCalledWith({
        project: cloudProject,
        includeContent: true
      });
    });
    expect(cacheCloudAsset).not.toHaveBeenCalled();

    resolveAsset(assetDetail("asset-1"));
    await synchronization;
    expect(cacheCloudAsset).toHaveBeenCalledTimes(1);
  });

  it("interrupts an opened project's remaining media synchronization", async () => {
    const { cancelCloudMirror, cacheCloudAsset, getLocalProject } =
      installCloudBridge();
    const shots = [{ timelineId: "timeline-1", assetId: "asset-1" }];
    getLocalProject.mockResolvedValue(
      localProjectWith([{ ...shots[0], status: "created" }])
    );
    get.mockImplementation((url: string, config?: { signal?: AbortSignal }) => {
      if (url === "/projects/timeline-project-1") {
        return Promise.resolve({ data: timelineProjectWith(shots) });
      }
      if (url === "/assets/asset-1") {
        return new Promise((_resolve, reject) => {
          config?.signal?.addEventListener(
            "abort",
            () => reject(new Error("cancelled")),
            { once: true }
          );
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const synchronization = syncCloudProject(
      "timeline-project-1",
      "timeline-1"
    );
    await vi.waitFor(() =>
      expect(get).toHaveBeenCalledWith("/assets/asset-1", {
        signal: expect.any(AbortSignal)
      })
    );
    cancelCloudProjectSync("timeline-project-1");

    await synchronization;
    expect(cacheCloudAsset).not.toHaveBeenCalled();
    expect(cancelCloudMirror).toHaveBeenCalledWith("timeline-project-1");
  });
});
