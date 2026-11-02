import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("electron", () => ({
  app: {
    isPackaged: false,
    getAppPath: () => process.cwd()
  }
}));

import type { FetchCloudStorage } from "../cloudStorage/fetchCloudStorageObject";

import { DatabaseManager } from "./databaseManager";
import { ProjectRepository } from "./projectRepository";
import { projects, scriptProjectMedia, scriptProjectSnapshots } from "./schema";
import {
  optimizedThumbnailUrl,
  ScriptProjectSnapshotRepository
} from "./scriptProjectSnapshotRepository";

const CLOUD_STORAGE_HOST = "mago-s3-prod.s3.eu-north-1.amazonaws.com";

const temporaryDirectories: string[] = [];
const managers: DatabaseManager[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  for (const manager of managers.splice(0)) manager.close();
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe("ScriptProjectSnapshotRepository", () => {
  test("looks up only the requested plan, tolerating invalid maps and literal keys", async () => {
    const { manager, snapshots } = await openSnapshotRepository();
    await snapshots.put({
      projectId: "bad-plans",
      metadataOnly: true,
      state: {}
    });
    await manager
      .get()
      .update(scriptProjectSnapshots)
      .set({ planDetailsJson: "{broken" })
      .where(eq(scriptProjectSnapshots.projectId, "bad-plans"));
    const planId = 'plan.with."quotes"';
    await snapshots.put({
      projectId: "good-plans",
      metadataOnly: true,
      planDetails: {
        [planId]: {
          id: planId,
          status: "RUNNING",
          nested: [{ thumbnail_url: "mago-media://asset/image" }]
        },
        other: { id: "other", status: "COMPLETED" }
      }
    });
    expect(await snapshots.getPlan(planId)).toEqual({
      id: planId,
      status: "RUNNING",
      nested: [{ thumbnail_url: "mago-media://thumbnail/image" }]
    });
    expect(await snapshots.getPlan("absent")).toBeNull();
    await snapshots.putPlan("good-plans", planId, {
      id: planId,
      status: "COMPLETED"
    });
    expect((await snapshots.getPlan(planId))?.status).toBe("COMPLETED");
    await manager
      .get()
      .update(scriptProjectSnapshots)
      .set({ planDetailsJson: '[{"id":"array-member"}]' })
      .where(eq(scriptProjectSnapshots.projectId, "bad-plans"));
    expect(await snapshots.getPlan("0")).toBeNull();
  });

  test("reads local media URLs without probing files and upgrades nested thumbnails", async () => {
    const { manager, snapshots } = await openSnapshotRepository();
    await snapshots.put({
      projectId: "local-preview",
      metadataOnly: true,
      state: {
        nested: [
          {
            url: "mago-media://script-project/generated",
            thumbnail_url: "mago-media://script-project/generated",
            poster_url: "mago-media://asset/poster"
          }
        ],
        untouched: "mago-media://asset/poster"
      }
    });
    await manager.get().insert(scriptProjectMedia).values({
      id: "generated",
      projectId: "local-preview",
      sourceUrl: "local-generated:generated",
      relativePath: "not-needed.mp4"
    });
    const getRoot = vi.fn(async () => {
      throw new Error("Already-local URLs must not require disk checks");
    });
    const reader = new ScriptProjectSnapshotRepository(manager, getRoot);
    expect((await reader.get("local-preview"))?.state).toEqual({
      nested: [
        {
          url: "mago-media://script-project/generated",
          thumbnail_url: "mago-media://script-project-thumbnail/generated",
          poster_url: "mago-media://asset/poster"
        }
      ],
      untouched: "mago-media://asset/poster"
    });
    expect(getRoot).not.toHaveBeenCalled();
  });

  test("does not localize remote references whose cached file is missing", async () => {
    const { manager, snapshots } = await openSnapshotRepository();
    const source = `https://${CLOUD_STORAGE_HOST}/missing.png`;
    await snapshots.put({
      projectId: "missing-preview",
      metadataOnly: true,
      state: { nested: [{ url: `${source}?signature=new` }] }
    });
    await manager.get().insert(scriptProjectMedia).values({
      id: "missing",
      projectId: "missing-preview",
      sourceUrl: source,
      relativePath: "missing.png"
    });
    expect((await snapshots.get("missing-preview"))?.state).toEqual({
      nested: [{ url: `${source}?signature=new` }]
    });
  });

  test("still refuses corrupt snapshot JSON", async () => {
    const { manager, snapshots } = await openSnapshotRepository();
    await snapshots.put({
      projectId: "corrupt-read",
      metadataOnly: true,
      state: {}
    });
    await manager
      .get()
      .update(scriptProjectSnapshots)
      .set({ cutJson: "{broken" })
      .where(eq(scriptProjectSnapshots.projectId, "corrupt-read"));
    await expect(snapshots.get("corrupt-read")).rejects.toThrow(
      "Could not read cut"
    );
  });

  test("lets a started media transfer finish when it is cancelled", async () => {
    const { manager } = await openSnapshotRepository();
    const libraryRoot = await mkdtemp(
      path.join(tmpdir(), "mago-script-cancel-")
    );
    temporaryDirectories.push(libraryRoot);
    let deliverResponse: (response: Response) => void = () => {};
    const fetchFromCloudStorage = vi.fn<FetchCloudStorage>((_url, init) => {
      expect(init.signal ?? undefined).toBeUndefined();
      return new Promise((resolve) => {
        deliverResponse = resolve;
      });
    });
    const snapshots = new ScriptProjectSnapshotRepository(
      manager,
      async () => libraryRoot,
      { allowedHosts: [CLOUD_STORAGE_HOST], fetchFromCloudStorage }
    );
    const url = `https://${CLOUD_STORAGE_HOST}/assets/cancel.mp4`;
    await snapshots.put({
      projectId: "cancel-project",
      metadataOnly: true,
      state: { url }
    });
    const pending = snapshots.cacheScheduledMedia("cancel-project", url);
    await vi.waitFor(() =>
      expect(fetchFromCloudStorage).toHaveBeenCalledOnce()
    );
    snapshots.cancelScheduledMedia("cancel-project", url);
    deliverResponse(
      new Response("video", { headers: { "content-type": "video/mp4" } })
    );
    await pending;
    expect((await snapshots.get("cancel-project"))?.state?.url).toMatch(
      /^mago-media:\/\/script-project\//
    );
  });

  test("cancels a scheduled media transfer still waiting for a download slot, and permits retry", async () => {
    const { manager } = await openSnapshotRepository();
    const libraryRoot = await mkdtemp(
      path.join(tmpdir(), "mago-script-queued-cancel-")
    );
    temporaryDirectories.push(libraryRoot);
    const deliverResponses: Array<(response: Response) => void> = [];
    const fetchFromCloudStorage = vi.fn<FetchCloudStorage>(
      () =>
        new Promise((resolve) => {
          deliverResponses.push(resolve);
        })
    );
    const snapshots = new ScriptProjectSnapshotRepository(
      manager,
      async () => libraryRoot,
      { allowedHosts: [CLOUD_STORAGE_HOST], fetchFromCloudStorage }
    );
    await snapshots.put({
      projectId: "queued-project",
      metadataOnly: true,
      state: {}
    });
    const slotHolderUrls = Array.from(
      { length: 6 },
      (_unused, slotNumber) =>
        `https://${CLOUD_STORAGE_HOST}/assets/slot-${slotNumber}.mp4`
    );
    const slotHolders = slotHolderUrls.map((slotHolderUrl) =>
      snapshots.cacheScheduledMedia("queued-project", slotHolderUrl)
    );
    await vi.waitFor(() =>
      expect(fetchFromCloudStorage).toHaveBeenCalledTimes(6)
    );
    const queuedUrl = `https://${CLOUD_STORAGE_HOST}/assets/queued.mp4`;
    const queued = snapshots.cacheScheduledMedia("queued-project", queuedUrl);
    const rejected = expect(queued).rejects.toThrow();
    snapshots.cancelScheduledMedia("other-project", queuedUrl);
    snapshots.cancelScheduledMedia("queued-project", queuedUrl);
    for (const deliverResponse of deliverResponses.splice(0))
      deliverResponse(
        new Response("video", { headers: { "content-type": "video/mp4" } })
      );
    await Promise.all(slotHolders);
    await rejected;
    expect(fetchFromCloudStorage).toHaveBeenCalledTimes(6);

    fetchFromCloudStorage.mockResolvedValueOnce(
      new Response("video", { headers: { "content-type": "video/mp4" } })
    );
    await snapshots.cacheScheduledMedia("queued-project", queuedUrl);
    expect(fetchFromCloudStorage).toHaveBeenCalledTimes(7);
  });
  test("persists metrics beside media without modifying the cut", async () => {
    const { snapshots } = await openSnapshotRepository();
    await snapshots.put({
      projectId: "metrics-project",
      project: { id: "metrics-project", name: "Metrics", origin: "local" },
      cut: { shots: [] }
    });
    const media = await snapshots.storeGeneratedMedia(
      "metrics-project",
      Buffer.from("video"),
      "mp4"
    );
    expect(await snapshots.getMediaMetrics(media.id)).toBeNull();
    await snapshots.putMediaMetrics(media.id, { status: "PENDING" });
    await snapshots.putMediaMetrics(media.id, {
      status: "COMPLETED",
      vid_score: 8.5
    });
    expect(await snapshots.getMediaMetrics(media.id)).toEqual({
      status: "COMPLETED",
      vid_score: 8.5
    });
    expect((await snapshots.get("metrics-project"))?.cut).toEqual({
      shots: []
    });
    await expect(snapshots.putMediaMetrics("../unknown", {})).rejects.toThrow(
      "unavailable"
    );
  });
  test("maps legacy full-size thumbnail URLs to optimized local previews", () => {
    expect(optimizedThumbnailUrl("mago-media://script-project/image-1")).toBe(
      "mago-media://script-project-thumbnail/image-1"
    );
    expect(optimizedThumbnailUrl("mago-media://asset/upload-1")).toBe(
      "mago-media://thumbnail/upload-1"
    );
    expect(optimizedThumbnailUrl("https://cdn.example/thumb.jpg")).toBe(
      "https://cdn.example/thumb.jpg"
    );
  });

  const openSnapshotRepository = async () => {
    const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-script-"));
    temporaryDirectories.push(libraryRoot);
    const manager = new DatabaseManager();
    managers.push(manager);
    await manager.open(libraryRoot);
    const snapshots = new ScriptProjectSnapshotRepository(
      manager,
      async () => libraryRoot
    );
    const readProjectSettings = async (projectId: string) => {
      const [row] = await manager
        .get()
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);
      return row
        ? (JSON.parse(row.settingsJson) as Record<string, unknown>)
        : null;
    };
    return { manager, snapshots, readProjectSettings };
  };

  test("keeps local-only catalog metadata when a cloud script project re-syncs", async () => {
    const { manager, snapshots, readProjectSettings } =
      await openSnapshotRepository();
    const now = new Date();
    await manager
      .get()
      .insert(projects)
      .values({
        id: "script-summary",
        name: "Cloud script",
        settingsJson: JSON.stringify({
          type: "script_to_shots",
          origin: "cloud",
          output_size: [1280, 720],
          cloudSummary: { total_renders: 7, preview_url: "https://cdn/p.jpg" }
        }),
        createdAt: now,
        updatedAt: now
      });

    await snapshots.put({
      projectId: "script-summary",
      project: {
        id: "script-summary",
        name: "Cloud script",
        type: "script_to_shots",
        settings: { output_size: [1920, 1080] }
      }
    });

    expect(await readProjectSettings("script-summary")).toEqual({
      type: "script_to_shots",
      origin: "cloud",
      output_size: [1920, 1080],
      cloudSummary: { total_renders: 7, preview_url: "https://cdn/p.jpg" }
    });
  });

  test("never turns a local project into a cloud mirror when a cloud script shares its id", async () => {
    const { manager, snapshots, readProjectSettings } =
      await openSnapshotRepository();
    const now = new Date();
    const localSettings = { type: "script_to_shots", origin: "local" };
    await manager
      .get()
      .insert(projects)
      .values({
        id: "shared-id",
        name: "Local script",
        settingsJson: JSON.stringify(localSettings),
        createdAt: now,
        updatedAt: now
      });

    await snapshots.put({
      projectId: "shared-id",
      project: {
        id: "shared-id",
        name: "Cloud script",
        type: "script_to_shots",
        settings: { output_size: [1920, 1080] }
      },
      state: { project_id: "shared-id", keys: [], shots: [] }
    });

    expect(await readProjectSettings("shared-id")).toEqual(localSettings);
    const [localProject] = await manager
      .get()
      .select()
      .from(projects)
      .where(eq(projects.id, "shared-id"));
    expect(localProject?.name).toBe("Local script");
    expect(await snapshots.get("shared-id")).toBeNull();
  });

  test("keeps a refreshed cloud snapshot on its durable local media URL", async () => {
    const fetchFromCloudStorage = vi.fn();
    const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-script-"));
    temporaryDirectories.push(libraryRoot);
    const manager = new DatabaseManager();
    managers.push(manager);
    await manager.open(libraryRoot);
    const snapshots = new ScriptProjectSnapshotRepository(
      manager,
      async () => libraryRoot,
      { allowedHosts: [CLOUD_STORAGE_HOST], fetchFromCloudStorage }
    );
    const projectId = "script-cached-media";
    const stableSource = `https://${CLOUD_STORAGE_HOST}/assets/reference.png`;
    const refreshedSource = `${stableSource}?signature=refreshed`;
    const mediaId = createHash("sha256")
      .update(`${projectId}\0${stableSource}`)
      .digest("hex");
    const relativePath = path.join(
      "script-projects",
      "cached-test",
      `${mediaId}.png`
    );
    await mkdir(path.join(libraryRoot, path.dirname(relativePath)), {
      recursive: true
    });
    await writeFile(path.join(libraryRoot, relativePath), "cached image");

    await snapshots.put({
      projectId,
      project: {
        id: projectId,
        name: "Cached cloud project",
        type: "script_to_shots"
      }
    });
    await manager.get().insert(scriptProjectMedia).values({
      id: mediaId,
      projectId,
      sourceUrl: stableSource,
      relativePath
    });

    await snapshots.put({
      projectId,
      state: {
        project_id: projectId,
        keys: [
          {
            token: "hero",
            images: [
              {
                asset_id: "asset-1",
                url: refreshedSource,
                thumbnail_url: refreshedSource
              }
            ]
          }
        ],
        shots: []
      }
    });

    const snapshot = await snapshots.get(projectId);
    expect(JSON.stringify(snapshot?.state)).not.toContain("https://");
    expect(snapshot?.state).toMatchObject({
      keys: [
        {
          images: [
            {
              url: `mago-media://script-project/${mediaId}`,
              thumbnail_url: `mago-media://script-project-thumbnail/${mediaId}`
            }
          ]
        }
      ]
    });
    expect(fetchFromCloudStorage).not.toHaveBeenCalled();
  });

  test("downloads snapshot media from Mago cloud storage and refuses any other host", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchFromCloudStorage = vi.fn<FetchCloudStorage>(
      async () =>
        new Response("png-bytes", {
          status: 200,
          headers: { "content-type": "image/png" }
        })
    );
    const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-script-"));
    temporaryDirectories.push(libraryRoot);
    const manager = new DatabaseManager();
    managers.push(manager);
    await manager.open(libraryRoot);
    const snapshots = new ScriptProjectSnapshotRepository(
      manager,
      async () => libraryRoot,
      { allowedHosts: [CLOUD_STORAGE_HOST], fetchFromCloudStorage }
    );
    const projectId = "script-allowlisted-media";
    const cloudStorageImage = `https://${CLOUD_STORAGE_HOST}/assets/hero.png?X-Amz-Signature=1`;
    const foreignImage = "https://169.254.169.254/latest/meta-data";

    await snapshots.put({
      projectId,
      metadataOnly: true,
      project: { id: projectId, name: "Cloud", type: "script_to_shots" },
      state: {
        images: [{ url: cloudStorageImage, thumbnail_url: cloudStorageImage }]
      },
      planDetails: { plan: { status: "COMPLETED" } }
    });
    expect(fetchFromCloudStorage).not.toHaveBeenCalled();
    expect((await snapshots.get(projectId))?.state).toEqual({
      images: [{ url: cloudStorageImage, thumbnail_url: cloudStorageImage }]
    });
    await snapshots.cacheScheduledMedia(projectId, cloudStorageImage);
    const earlySnapshot = await snapshots.get(projectId);
    const earlyImages = earlySnapshot?.state?.images as Array<{
      url: string;
      thumbnail_url: string;
    }>;
    expect(earlyImages[0]?.url).toMatch(/^mago-media:\/\/script-project\//);
    expect(earlyImages[0]?.thumbnail_url).toMatch(
      /^mago-media:\/\/script-project-thumbnail\//
    );
    expect(earlySnapshot?.planDetails).toEqual({
      plan: { status: "COMPLETED" }
    });
    await snapshots.put({
      projectId,
      metadataOnly: true,
      state: {
        images: [
          { url: cloudStorageImage.replace("Signature=1", "Signature=2") }
        ]
      }
    });
    expect(
      (
        ((await snapshots.get(projectId))?.state?.images ?? []) as Array<{
          url: string;
        }>
      )[0]?.url
    ).toBe(earlyImages[0]?.url);

    await snapshots.put({
      projectId,
      project: { id: projectId, name: "Cloud", type: "script_to_shots" },
      state: {
        project_id: projectId,
        keys: [
          { token: "hero", images: [{ url: cloudStorageImage }] },
          { token: "villain", images: [{ url: foreignImage }] }
        ],
        shots: []
      }
    });

    expect(fetchFromCloudStorage).toHaveBeenCalledTimes(1);
    expect(String(fetchFromCloudStorage.mock.calls[0]?.[0])).toBe(
      cloudStorageImage
    );
    const snapshot = await snapshots.get(projectId);
    const [hero, villain] = (snapshot?.state?.keys ?? []) as Array<{
      images: Array<{ url: string }>;
    }>;
    expect(hero?.images[0]?.url).toMatch(/^mago-media:\/\/script-project\//);
    expect(villain?.images[0]?.url).toBe(foreignImage);
    const mediaPath = await snapshots.resolveMediaPath(
      hero!.images[0]!.url.replace(/^.*\//, "")
    );
    await expect(readFile(mediaPath!, "utf8")).resolves.toBe("png-bytes");
  });

  test("refuses to store remote media from a host outside Mago cloud storage", async () => {
    const fetchFromCloudStorage = vi.fn();
    const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-script-"));
    temporaryDirectories.push(libraryRoot);
    const manager = new DatabaseManager();
    managers.push(manager);
    await manager.open(libraryRoot);
    const snapshots = new ScriptProjectSnapshotRepository(
      manager,
      async () => libraryRoot,
      { allowedHosts: [CLOUD_STORAGE_HOST], fetchFromCloudStorage }
    );

    await expect(
      snapshots.storeRemoteMedia("script-1", "https://evil.example/mara.png")
    ).rejects.toThrow("not Mago cloud storage");
    expect(fetchFromCloudStorage).not.toHaveBeenCalled();
  });

  test("persists a script project and its read model across a restart", async () => {
    const libraryRoot = await mkdtemp(path.join(tmpdir(), "mago-script-"));
    temporaryDirectories.push(libraryRoot);
    const firstManager = new DatabaseManager();
    managers.push(firstManager);
    await firstManager.open(libraryRoot);
    const snapshots = new ScriptProjectSnapshotRepository(
      firstManager,
      async () => libraryRoot
    );

    await snapshots.put({
      projectId: "script-1",
      project: {
        id: "script-1",
        name: "Offline screenplay",
        description: "",
        active: true,
        type: "script_to_shots",
        created_at: "2024-03-02T12:00:00Z",
        updated_at: "2026-09-18T12:00:00Z",
        settings: { output_size: [1920, 1080] }
      },
      state: {
        project_id: "script-1",
        keys: [],
        shots: [{ timeline_id: "shot-1", shot_index: 0, sequence_id: 1 }]
      },
      scriptVersions: { active_version: 1, versions: [{ version: 1 }] },
      planDetails: {
        "plan-1": {
          id: "plan-1",
          steps: [{ tool_args: { script: "FADE IN" } }]
        }
      },
      cut: { project_id: "script-1", shots: [], missing: [], export: null }
    });
    // A detail refresh has no timestamps; it must not turn the sync time into
    // the project's apparent age.
    await snapshots.put({
      projectId: "script-1",
      project: {
        id: "script-1",
        name: "Offline screenplay",
        description: "",
        active: true,
        type: "script_to_shots",
        settings: { output_size: [1920, 1080] }
      }
    });
    firstManager.close();

    const secondManager = new DatabaseManager();
    managers.push(secondManager);
    await secondManager.open(libraryRoot);
    const reopenedSnapshots = new ScriptProjectSnapshotRepository(
      secondManager,
      async () => libraryRoot
    );
    const projects = new ProjectRepository(
      secondManager,
      async () => libraryRoot
    );

    expect(await reopenedSnapshots.get("script-1")).toEqual(
      expect.objectContaining({
        state: expect.objectContaining({ project_id: "script-1" }),
        scriptVersions: expect.objectContaining({ active_version: 1 }),
        planDetails: expect.objectContaining({
          "plan-1": expect.objectContaining({ id: "plan-1" })
        }),
        cut: expect.objectContaining({ project_id: "script-1" })
      })
    );
    await expect(reopenedSnapshots.getPlan("plan-1")).resolves.toEqual(
      expect.objectContaining({ id: "plan-1" })
    );
    expect(await projects.get("script-1")).toEqual(
      expect.objectContaining({
        id: "script-1",
        name: "Offline screenplay",
        origin: "cloud",
        type: "script_to_shots"
      })
    );
    expect(await projects.list()).toEqual([
      expect.objectContaining({
        id: "script-1",
        origin: "cloud",
        created_at: "2024-03-02T12:00:00.000Z",
        updated_at: "2024-03-02T12:00:00.000Z",
        timeline_count: 1
      })
    ]);
  });
});
