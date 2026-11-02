import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("electron", () => ({
  app: {
    isPackaged: false,
    getAppPath: () => process.cwd()
  }
}));

import { eq } from "drizzle-orm";

import { CloudLinkRepository } from "../cloud/cloudLinkRepository";
import type { FetchCloudStorage } from "../cloudStorage/fetchCloudStorageObject";

import { CloudProjectMirrorRepository } from "./cloudProjectMirrorRepository";
import { DatabaseManager } from "./databaseManager";
import { ProjectRepository } from "./projectRepository";
import {
  assets,
  clips,
  cloudLinks as cloudLinksTable,
  cloudRenderJobs,
  projectAssets
} from "./schema";

const temporaryDirectories: string[] = [];
const managers: DatabaseManager[] = [];

afterEach(async () => {
  for (const manager of managers.splice(0)) manager.close();
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

const openRepositories = async () => {
  const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-cloud-project-"));
  temporaryDirectories.push(libraryRoot);
  const manager = new DatabaseManager();
  managers.push(manager);
  await manager.open(libraryRoot);
  const fetchFromCloudStorage = vi.fn<FetchCloudStorage>(
    async () => new Response("downloaded bytes", { status: 200 })
  );
  return {
    libraryRoot,
    manager,
    fetchFromCloudStorage,
    cloudLinks: new CloudLinkRepository(manager),
    mirrors: new CloudProjectMirrorRepository(
      manager,
      async () => libraryRoot,
      { allowedHosts: [CLOUD_STORAGE_HOST], fetchFromCloudStorage }
    ),
    projects: new ProjectRepository(manager, async () => libraryRoot)
  };
};

const CLOUD_STORAGE_HOST = "mago-s3-prod.s3.eu-north-1.amazonaws.com";
const CLOUD_VIDEO_URL = `https://${CLOUD_STORAGE_HOST}/assets/video.mp4?X-Amz-Signature=1`;

test("downloads the thumbnail before the source and can interrupt just one asset", async () => {
  const { mirrors, fetchFromCloudStorage } = await openRepositories();
  let sourceSignal: AbortSignal | null | undefined;
  fetchFromCloudStorage.mockImplementation(async (url, init) => {
    if (String(url).includes("thumbnail")) return new Response("poster");
    sourceSignal = init.signal;
    return new Promise((_resolve, reject) => {
      init.signal?.addEventListener(
        "abort",
        () => reject(init.signal?.reason),
        { once: true }
      );
    });
  });
  const download = mirrors.cacheAsset({
    projectId: "project",
    assetId: "asset",
    isImage: false,
    urls: {
      sourceUrl: CLOUD_VIDEO_URL,
      thumbnailUrl: `https://${CLOUD_STORAGE_HOST}/thumbnail.jpg`
    }
  });
  const rejected = expect(download).rejects.toThrow();
  await vi.waitFor(() => expect(sourceSignal).toBeDefined());
  expect(String(fetchFromCloudStorage.mock.calls[0][0])).toContain("thumbnail");
  mirrors.cancelAsset("other-project", "asset");
  expect(sourceSignal?.aborted).toBe(false);
  mirrors.cancelAsset("project", "asset");
  await rejected;
  expect(sourceSignal?.aborted).toBe(true);
});

const LOCAL_CONTENT_PROJECT_ID = "cloud-project-with-local-renders";

const cloudSourceClip = (clipId: string, assetId: string) => ({
  id: clipId,
  name: "source.mp4",
  asset_id: assetId,
  data: { duration: 24, timeline_offset: 0 },
  asset: {
    id: assetId,
    name: "source.mp4",
    type: "VIDEO",
    origin: "uploaded",
    rate: 0,
    data: { fps: 24, total_frames: 24 }
  }
});

const cloudLayer = (
  id: string,
  type: string,
  {
    name = id,
    layerClips = []
  }: { name?: string; layerClips?: Record<string, unknown>[] } = {}
) => ({
  id,
  name,
  type,
  layer_order: 0,
  rating: 0,
  data: {},
  clips: layerClips
});

const cloudTimeline = (id: string, layers: Record<string, unknown>[]) => ({
  id,
  name: id,
  settings: {},
  layers
});

const cloudProjectWithTimelines = (timelines: Record<string, unknown>[]) => ({
  id: LOCAL_CONTENT_PROJECT_ID,
  name: "Cloud project with local renders",
  type: "timeline",
  timelines
});

const addLocalRenderClip = async (
  manager: DatabaseManager,
  {
    trackId,
    clipId,
    assetId
  }: { trackId: string; clipId: string; assetId: string }
) => {
  const database = manager.get();
  const now = new Date();
  await database.insert(assets).values({
    id: assetId,
    name: "Local render",
    type: "video",
    origin: "generated",
    sourcePath: path.join("library", "renders", assetId + ".mp4"),
    status: "available",
    dataJson: JSON.stringify({ origin: "generated" }),
    createdAt: now,
    updatedAt: now
  });
  await database.insert(clips).values({
    id: clipId,
    trackId,
    assetId,
    name: "Local render",
    dataJson: "{}",
    createdAt: now,
    updatedAt: now
  });
  await database
    .insert(projectAssets)
    .values({ projectId: LOCAL_CONTENT_PROJECT_ID, assetId, createdAt: now });
};

type ReadLayer = {
  id: string;
  name: string;
  cloud_mirrored: boolean;
  clips: Array<{ id: string }>;
};

const readShotLayers = async (
  projects: ProjectRepository,
  shotId: string
): Promise<ReadLayer[]> => {
  const project = await projects.get(LOCAL_CONTENT_PROJECT_ID);
  const timelines = (project?.timelines ?? []) as Array<{
    id: string;
    layers: ReadLayer[];
  }>;
  return timelines.find((timeline) => timeline.id === shotId)?.layers ?? [];
};

describe("CloudProjectMirrorRepository", () => {
  test("keeps a cloud project's local-only render content across a re-sync and rebuilds mirrored tracks", async () => {
    const { manager, mirrors, projects } = await openRepositories();
    await mirrors.put({
      project: cloudProjectWithTimelines([
        cloudTimeline("shot-1", [
          cloudLayer("input", "IMAGE", {
            layerClips: [cloudSourceClip("cloud-clip-1", "cloud-asset-1")]
          }),
          cloudLayer("cloud-render-removed-in-cloud", "RENDER"),
          cloudLayer("cloud-img2img", "IMG2IMG")
        ])
      ]),
      includeContent: true
    });
    const localRenderTrack = await projects.createTrack({
      shotId: "shot-1",
      name: "Local render",
      type: "RENDER",
      data: { renderEngine: "magov2" },
      parentTrackOrder: 1
    });
    const localRenderTrackId = String(localRenderTrack.id);
    await addLocalRenderClip(manager, {
      trackId: localRenderTrackId,
      clipId: "local-render-clip",
      assetId: "local-render-asset"
    });
    await addLocalRenderClip(manager, {
      trackId: "cloud-img2img",
      clipId: "local-img2img-clip",
      assetId: "local-img2img-asset"
    });

    await mirrors.put({
      project: cloudProjectWithTimelines([
        cloudTimeline("shot-1", [
          cloudLayer("input", "IMAGE", {
            name: "Input renamed in cloud",
            layerClips: [cloudSourceClip("cloud-clip-1", "cloud-asset-1")]
          }),
          cloudLayer("cloud-render-added-in-cloud", "RENDER"),
          cloudLayer("cloud-img2img", "IMG2IMG")
        ])
      ]),
      includeContent: true
    });

    const layers = await readShotLayers(projects, "shot-1");
    expect(layers.map(({ id }) => id).sort()).toEqual(
      [
        "cloud-img2img",
        "cloud-render-added-in-cloud",
        "input",
        localRenderTrackId
      ].sort()
    );
    const layerById = new Map(layers.map((layer) => [layer.id, layer]));
    expect(layerById.get("input")).toEqual(
      expect.objectContaining({
        name: "Input renamed in cloud",
        cloud_mirrored: true,
        clips: [expect.objectContaining({ id: "cloud-clip-1" })]
      })
    );
    expect(layerById.get(localRenderTrackId)).toEqual(
      expect.objectContaining({
        cloud_mirrored: false,
        clips: [expect.objectContaining({ id: "local-render-clip" })]
      })
    );
    expect(layerById.get("cloud-img2img")).toEqual(
      expect.objectContaining({
        cloud_mirrored: true,
        clips: [expect.objectContaining({ id: "local-img2img-clip" })]
      })
    );
    for (const assetId of [
      "local-render-asset",
      "local-img2img-asset",
      "cloud-asset-1"
    ]) {
      expect((await projects.getAsset(assetId))?.project_ids).toEqual([
        LOCAL_CONTENT_PROJECT_ID
      ]);
    }
  });

  test("drops a local-only track whose shot was deleted in the cloud but keeps its asset", async () => {
    const { manager, mirrors, projects } = await openRepositories();
    await mirrors.put({
      project: cloudProjectWithTimelines([
        cloudTimeline("shot-1", [cloudLayer("input-1", "IMAGE")]),
        cloudTimeline("shot-2", [cloudLayer("input-2", "IMAGE")])
      ]),
      includeContent: true
    });
    const localRenderTrack = await projects.createTrack({
      shotId: "shot-2",
      name: "Local render",
      type: "RENDER",
      data: {},
      parentTrackOrder: 1
    });
    await addLocalRenderClip(manager, {
      trackId: String(localRenderTrack.id),
      clipId: "orphaned-local-clip",
      assetId: "orphaned-local-asset"
    });

    await mirrors.put({
      project: cloudProjectWithTimelines([
        cloudTimeline("shot-1", [cloudLayer("input-1", "IMAGE")])
      ]),
      includeContent: true
    });

    const project = await projects.get(LOCAL_CONTENT_PROJECT_ID);
    expect(
      ((project?.timelines ?? []) as Array<{ id: string }>).map(({ id }) => id)
    ).toEqual(["shot-1"]);
    expect(
      (await projects.getAsset("orphaned-local-asset"))?.project_ids
    ).toEqual([LOCAL_CONTENT_PROJECT_ID]);
  });

  test("still replaces a cloud render's local placeholder clip with the cloud's own on re-sync", async () => {
    const { manager, mirrors, projects } = await openRepositories();
    const project = cloudProjectWithTimelines([
      cloudTimeline("shot-1", [cloudLayer("cloud-render-output", "RENDER")])
    ]);
    await mirrors.put({ project, includeContent: true });
    await addLocalRenderClip(manager, {
      trackId: "cloud-render-output",
      clipId: "cloud-render-placeholder-clip",
      assetId: "cloud-render-placeholder-asset"
    });
    await manager.get().insert(cloudRenderJobs).values({
      id: "cloud-render-job",
      model: "cloud-model",
      projectId: LOCAL_CONTENT_PROJECT_ID,
      shotId: "shot-1",
      trackId: "cloud-render-output",
      clipId: "cloud-render-placeholder-clip",
      assetId: "cloud-render-placeholder-asset",
      requestJson: "{}"
    });

    await mirrors.put({ project, includeContent: true });

    expect(
      (await readShotLayers(projects, "shot-1")).map(({ id, clips }) => ({
        id,
        clips
      }))
    ).toEqual([{ id: "cloud-render-output", clips: [] }]);
    expect(
      (await projects.getAsset("cloud-render-placeholder-asset"))?.project_ids
    ).toEqual([]);
  });

  test("rebuilds every track of a project mirrored before track links existed", async () => {
    const { manager, mirrors, projects } = await openRepositories();
    const project = cloudProjectWithTimelines([
      cloudTimeline("shot-1", [cloudLayer("input", "IMAGE")])
    ]);
    await mirrors.put({ project, includeContent: true });
    await manager
      .get()
      .delete(cloudLinksTable)
      .where(eq(cloudLinksTable.kind, "layer"));
    await projects.createTrack({
      shotId: "shot-1",
      name: "Indistinguishable from a mirrored track",
      type: "RENDER",
      data: {},
      parentTrackOrder: 1
    });
    expect(
      (await readShotLayers(projects, "shot-1")).every(
        (layer) => layer.cloud_mirrored
      )
    ).toBe(true);

    await mirrors.put({ project, includeContent: true });

    expect(
      (await readShotLayers(projects, "shot-1")).map(({ id }) => id)
    ).toEqual(["input"]);
  });

  test("orders cloud projects by original creation date, not synchronization time", async () => {
    const { mirrors, projects } = await openRepositories();
    await mirrors.put({
      project: {
        id: "older-cloud-project",
        name: "Older",
        type: "timeline",
        created_at: "2021-04-05T00:00:00Z",
        updated_at: "2026-09-18T12:00:00Z"
      }
    });
    await mirrors.put({
      project: {
        id: "newer-cloud-project",
        name: "Newer",
        type: "timeline",
        created_at: "2024-07-08T00:00:00Z",
        updated_at: "2026-09-18T12:00:00Z"
      }
    });

    expect(
      (await projects.list()).map(({ id, updated_at }) => ({ id, updated_at }))
    ).toEqual([
      {
        id: "newer-cloud-project",
        updated_at: "2024-07-08T00:00:00.000Z"
      },
      {
        id: "older-cloud-project",
        updated_at: "2021-04-05T00:00:00.000Z"
      }
    ]);
  });

  test("persists cloud timeline metadata and its normal local read model", async () => {
    const { mirrors, projects } = await openRepositories();
    const summary = {
      id: "cloud-project-1",
      name: "Cloud timeline",
      type: "timeline",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-02-01T00:00:00Z",
      timeline_count: 1,
      total_renders: 3,
      total_img2img: 2,
      preview_url: "https://cdn.example/preview.jpg"
    };

    // Simulate a project first discovered by an older mirror that had no
    // creation timestamp, then repair it from the authoritative list payload.
    await expect(
      mirrors.put({
        project: { id: summary.id, name: summary.name, type: summary.type }
      })
    ).resolves.toBe(true);
    await expect(mirrors.put({ project: summary })).resolves.toBe(true);
    expect(await projects.list()).toEqual([
      expect.objectContaining({
        id: "cloud-project-1",
        origin: "cloud",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        timeline_count: 1,
        total_renders: 3,
        preview_url: "https://cdn.example/preview.jpg"
      })
    ]);

    await mirrors.put({
      project: {
        ...summary,
        description: "Mirrored for offline viewing",
        active: true,
        settings: { rangeMin: 0, rangeMax: 24 },
        timelines: [
          {
            id: "shot-1",
            name: "Shot 1",
            settings: {},
            layers: [
              {
                id: "track-1",
                name: "Input",
                type: "IMAGE",
                visible: true,
                muted: false,
                active: true,
                layer_order: 0,
                rating: 0,
                data: {},
                clips: [
                  {
                    id: "clip-1",
                    name: "source.mp4",
                    asset_id: "asset-1",
                    data: { duration: 24, timeline_offset: 0 },
                    asset: {
                      id: "asset-1",
                      name: "source.mp4",
                      type: "VIDEO",
                      origin: "uploaded",
                      rate: 0,
                      data: {
                        fps: 24,
                        total_frames: 24,
                        duration_seconds: 1,
                        size: [1280, 720]
                      }
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      includeContent: true
    });

    expect(await projects.get("cloud-project-1")).toEqual(
      expect.objectContaining({
        id: "cloud-project-1",
        origin: "cloud",
        timelines: [
          expect.objectContaining({
            id: "shot-1",
            layers: [
              expect.objectContaining({
                id: "track-1",
                clips: [
                  expect.objectContaining({
                    id: "clip-1",
                    asset: expect.objectContaining({ id: "asset-1" })
                  })
                ]
              })
            ]
          })
        ]
      })
    );
  });

  test("links cloud reference images that only appear in a render's sources", async () => {
    const { cloudLinks, fetchFromCloudStorage, manager, mirrors, projects } =
      await openRepositories();
    const renderAsset = {
      id: "render-asset",
      name: "render.mp4",
      type: "VIDEO",
      data: {
        data: {
          sources: {
            images: [{ asset_id: "cloud-reference", type: "reference_frame" }]
          },
          render_settings: {
            magov2: {
              mago_engine: "v8.0.0",
              image_ids: ["local-reference"]
            }
          }
        }
      }
    };
    const now = new Date();
    await manager.get().insert(assets).values({
      id: "local-reference",
      name: "Local reference",
      type: "image",
      origin: "uploaded",
      sourcePath: "C:/references/local-reference.png",
      status: "available",
      active: true,
      dataJson: "{}",
      createdAt: now,
      updatedAt: now
    });
    await cloudLinks.put({
      kind: "asset",
      localId: "local-reference",
      cloudId: "local-reference",
      data: { origin: "cloud" }
    });

    await mirrors.put({
      project: {
        id: "cloud-project-1",
        name: "Cloud project",
        type: "timeline",
        timelines: [
          {
            id: "shot-1",
            layers: [
              {
                id: "render-track",
                type: "RENDER",
                clips: [
                  {
                    id: "render-clip",
                    asset_id: "render-asset",
                    asset: renderAsset
                  }
                ]
              }
            ]
          }
        ]
      },
      includeContent: true
    });

    expect(await cloudLinks.get("asset", "cloud-reference")).toMatchObject({
      cloudId: "cloud-reference",
      data: { origin: "cloud", status: "ingested", kind: "image" }
    });
    expect(await cloudLinks.get("asset", "local-reference")).toMatchObject({
      cloudId: "cloud-reference",
      data: { status: "ingested", kind: "image" }
    });
    expect(
      (await cloudLinks.get("asset", "local-reference"))?.data
    ).not.toHaveProperty("origin");
    expect(
      await manager
        .get()
        .select()
        .from(assets)
        .where(eq(assets.id, "cloud-reference"))
    ).toEqual([
      expect.objectContaining({
        id: "cloud-reference",
        type: "image",
        status: "pending"
      })
    ]);

    fetchFromCloudStorage.mockImplementation(async (url) => {
      if (String(url).includes("thumbnail")) {
        throw new Error("thumbnail unavailable");
      }
      return new Response("full image", { status: 200 });
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      mirrors.cacheAsset({
        projectId: "cloud-project-1",
        assetId: "cloud-reference",
        isImage: true,
        urls: {
          sourceUrl: `https://${CLOUD_STORAGE_HOST}/cloud-reference.png`,
          thumbnailUrl: `https://${CLOUD_STORAGE_HOST}/thumbnail.jpg`
        }
      })
    ).resolves.toBe(true);
    warn.mockRestore();

    const [cachedReference] = await manager
      .get()
      .select()
      .from(assets)
      .where(eq(assets.id, "cloud-reference"));
    expect(cachedReference).toMatchObject({
      status: "available",
      thumbnailRelativePath: cachedReference?.relativeSourcePath
    });
    await expect(
      projects.resolveMediaPath("thumbnail", "cloud-reference")
    ).resolves.toBe(cachedReference?.sourcePath);
  });

  test("rejects hidden cloud render mirrors of locally-owned projects", async () => {
    const { cloudLinks, mirrors, projects } = await openRepositories();
    const localProject = await projects.create({
      name: "Private local project",
      description: "",
      settings: {}
    });
    await cloudLinks.put({
      kind: "project",
      localId: localProject.id,
      cloudId: "hidden-cloud-copy"
    });

    await expect(
      mirrors.put({
        project: {
          id: "hidden-cloud-copy",
          name: "Should not appear",
          type: "timeline"
        }
      })
    ).resolves.toBe(false);
    expect((await projects.list()).map(({ id }) => id)).toEqual([
      localProject.id
    ]);
  });

  test("does not download an asset file that is already cached", async () => {
    const { fetchFromCloudStorage, libraryRoot, mirrors } =
      await openRepositories();
    const project = {
      id: "cloud-project-resume",
      name: "Resumable cloud project",
      type: "timeline",
      timelines: [
        {
          id: "shot-1",
          name: "Shot 1",
          layers: [
            {
              id: "track-1",
              name: "Video",
              type: "IMAGE",
              clips: [
                {
                  id: "clip-1",
                  asset_id: "asset-1",
                  asset: {
                    id: "asset-1",
                    name: "video.mp4",
                    type: "VIDEO",
                    data: {}
                  }
                }
              ]
            }
          ]
        }
      ]
    };

    await mirrors.put({ project, includeContent: true });
    const projectHash = createHash("sha256")
      .update(project.id)
      .digest("hex")
      .slice(0, 24);
    const assetHash = createHash("sha256")
      .update("asset-1")
      .digest("hex")
      .slice(0, 32);
    const cachedPath = path.join(
      libraryRoot,
      "cloud-projects",
      projectHash,
      `${assetHash}-source.mp4`
    );
    await mkdir(path.dirname(cachedPath), { recursive: true });
    await writeFile(cachedPath, "already downloaded");

    const isCached = await mirrors.cacheAsset({
      projectId: project.id,
      assetId: "asset-1",
      isImage: false,
      urls: { sourceUrl: CLOUD_VIDEO_URL }
    });

    expect(isCached).toBe(true);
    expect(fetchFromCloudStorage).not.toHaveBeenCalled();
  });

  test("marks one asset available as soon as its own file is cached", async () => {
    const { libraryRoot, mirrors, projects } = await openRepositories();
    const project = {
      id: "cloud-project-per-asset",
      name: "Per-asset cloud project",
      type: "timeline",
      timelines: ["asset-1", "asset-2"].map((assetId, index) => ({
        id: `shot-${index}`,
        name: `Shot ${index}`,
        layers: [
          {
            id: `track-${index}`,
            name: "Video",
            type: "IMAGE",
            clips: [
              {
                id: `clip-${index}`,
                asset_id: assetId,
                asset: {
                  id: assetId,
                  name: "video.mp4",
                  type: "VIDEO",
                  data: {}
                }
              }
            ]
          }
        ]
      }))
    };
    await mirrors.put({ project, includeContent: true });
    const hash = (value: string, length: number) =>
      createHash("sha256").update(value).digest("hex").slice(0, length);
    const cachedPath = path.join(
      libraryRoot,
      "cloud-projects",
      hash(project.id, 24),
      `${hash("asset-1", 32)}-source.mp4`
    );
    await mkdir(path.dirname(cachedPath), { recursive: true });
    await writeFile(cachedPath, "already downloaded");

    await expect(
      mirrors.cacheAsset({
        projectId: project.id,
        assetId: "asset-1",
        isImage: false,
        urls: { sourceUrl: CLOUD_VIDEO_URL }
      })
    ).resolves.toBe(true);

    type LocalTimeline = {
      layers: {
        clips: { asset: { id: string; data: { status: string } } }[];
      }[];
    };
    const localProject = await projects.get(project.id);
    const timelines = (localProject?.timelines ?? []) as LocalTimeline[];
    const statuses = Object.fromEntries(
      timelines.map(({ layers }) => [
        layers[0].clips[0].asset.id,
        layers[0].clips[0].asset.data.status
      ])
    );
    expect(statuses).toEqual({ "asset-1": "ingested", "asset-2": "created" });
  });

  test("downloads an asset from Mago cloud storage into the library", async () => {
    const { fetchFromCloudStorage, libraryRoot, mirrors } =
      await openRepositories();

    await expect(
      mirrors.cacheAsset({
        projectId: "cloud-project-download",
        assetId: "asset-download",
        isImage: false,
        urls: { sourceUrl: CLOUD_VIDEO_URL }
      })
    ).resolves.toBe(true);

    expect(String(fetchFromCloudStorage.mock.calls[0]?.[0])).toBe(
      CLOUD_VIDEO_URL
    );
    const hash = (value: string, length: number) =>
      createHash("sha256").update(value).digest("hex").slice(0, length);
    await expect(
      readFile(
        path.join(
          libraryRoot,
          "cloud-projects",
          hash("cloud-project-download", 24),
          `${hash("asset-download", 32)}-source.mp4`
        ),
        "utf8"
      )
    ).resolves.toBe("downloaded bytes");
  });

  test("refuses to fetch asset media from a host outside Mago cloud storage", async () => {
    const { fetchFromCloudStorage, mirrors } = await openRepositories();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      mirrors.cacheAsset({
        projectId: "cloud-project-foreign",
        assetId: "asset-foreign",
        isImage: true,
        urls: {
          sourceUrl: "https://169.254.169.254/latest/meta-data",
          thumbnailUrl: "https://evil.example/thumbnail.jpg"
        }
      })
    ).resolves.toBe(false);

    expect(fetchFromCloudStorage).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  test("reports an asset with no downloadable source as not cached", async () => {
    const { mirrors } = await openRepositories();
    await expect(
      mirrors.cacheAsset({
        projectId: "cloud-project-none",
        assetId: "asset-missing",
        isImage: false,
        urls: {}
      })
    ).resolves.toBe(false);
  });

  test("plays an uploaded source clip for its asset's length, not the backend's placeholder duration", async () => {
    const { mirrors, projects } = await openRepositories();
    const clipFor = (
      id: string,
      layerType: string,
      assetType: string,
      duration: number
    ) => ({
      id: `track-${id}`,
      name: id,
      type: layerType,
      clips: [
        {
          id: `clip-${id}`,
          asset_id: `asset-${id}`,
          data: { duration, timeline_offset: 0 },
          asset: {
            id: `asset-${id}`,
            name: `${id}.mp4`,
            type: assetType,
            data: { fps: 24, duration: 361, total_frames: 362 }
          }
        }
      ]
    });
    await mirrors.put({
      project: {
        id: "cloud-project-duration",
        name: "Durations",
        type: "timeline",
        timelines: [
          {
            id: "shot-1",
            name: "Shot",
            layers: [
              clipFor("source", "IMAGE", "VIDEO", 1),
              clipFor("render", "RENDER", "RENDER", 48)
            ]
          }
        ]
      },
      includeContent: true
    });

    type LocalTimeline = {
      layers: { id: string; clips: { data: { duration: number } }[] }[];
    };
    const localProject = await projects.get("cloud-project-duration");
    const [timeline] = (localProject?.timelines ?? []) as LocalTimeline[];
    const durations = Object.fromEntries(
      timeline.layers.map((layer) => [layer.id, layer.clips[0].data.duration])
    );
    expect(durations).toEqual({ "track-source": 361, "track-render": 48 });
  });
  test("links each cloud asset as already in the cloud, on the layer it came from", async () => {
    const { mirrors, cloudLinks } = await openRepositories();
    const project = {
      id: "cloud-project-links",
      name: "Links",
      type: "timeline",
      timelines: [
        {
          id: "shot-1",
          name: "Shot",
          layers: [
            {
              id: "source-layer",
              type: "IMAGE",
              clips: [
                {
                  id: "source-clip",
                  asset_id: "source-asset",
                  data: { duration: 1, timeline_offset: 0 },
                  asset: {
                    id: "source-asset",
                    type: "VIDEO",
                    data: { fps: 24, duration: 47, total_frames: 48 }
                  }
                }
              ]
            },
            {
              id: "render-layer",
              type: "RENDER",
              clips: [
                {
                  id: "reference-clip",
                  asset_id: "reference-image",
                  data: {},
                  asset: { id: "reference-image", type: "IMAGE", data: {} }
                }
              ]
            }
          ]
        }
      ]
    };
    await cloudLinks.put({
      kind: "asset",
      localId: "source-asset",
      cloudId: "duplicate-upload",
      data: { status: "uploading", cloudLayerId: "duplicate-layer" }
    });
    await cloudLinks.put({
      kind: "timeline",
      localId: "shot-1",
      cloudId: "duplicate-timeline"
    });

    await mirrors.put({ project, includeContent: true });

    expect(await cloudLinks.get("asset", "source-asset")).toMatchObject({
      cloudId: "source-asset",
      data: {
        origin: "cloud",
        status: "ingested",
        cloudLayerId: "source-layer"
      }
    });
    expect(await cloudLinks.get("asset", "reference-image")).toMatchObject({
      cloudId: "reference-image",
      data: {
        origin: "cloud",
        status: "ingested",
        cloudLayerId: "render-layer",
        kind: "image"
      }
    });
    expect(await cloudLinks.get("timeline", "shot-1")).toMatchObject({
      cloudId: "shot-1",
      data: { origin: "cloud" }
    });
  });
});
