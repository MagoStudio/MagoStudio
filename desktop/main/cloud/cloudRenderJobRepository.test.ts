import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("electron", () => ({
  app: { isPackaged: false, getAppPath: () => process.cwd() }
}));

import { DatabaseManager } from "../database/databaseManager";
import { assets, clips, projects, shots, tracks } from "../database/schema";

import { CloudRenderJobRepository } from "./cloudRenderJobRepository";

const temporaryDirectories: string[] = [];
const managers: DatabaseManager[] = [];

/**
 * A cloud render job references real local rows, so the fixture creates the
 * project/shot/track/clip/asset chain the foreign keys require.
 */
const openLibrary = async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "mago-cloud-jobs-"));
  temporaryDirectories.push(directory);
  const manager = new DatabaseManager();
  managers.push(manager);
  await manager.open(directory);

  const now = new Date();
  const database = manager.get();
  await database
    .insert(projects)
    .values({ id: "p1", name: "Project", createdAt: now, updatedAt: now });
  await database.insert(shots).values({
    id: "s1",
    projectId: "p1",
    name: "Shot",
    createdAt: now,
    updatedAt: now
  });
  await database.insert(tracks).values({
    id: "t1",
    shotId: "s1",
    projectId: "p1",
    name: "Track",
    type: "MAGOV2",
    createdAt: now,
    updatedAt: now
  });
  await database.insert(assets).values({
    id: "a1",
    name: "output",
    type: "video",
    origin: "generated",
    sourcePath: "pending",
    status: "PENDING",
    createdAt: now,
    updatedAt: now
  });
  await database.insert(clips).values({
    id: "c1",
    trackId: "t1",
    assetId: "a1",
    name: "output",
    createdAt: now,
    updatedAt: now
  });

  return new CloudRenderJobRepository(manager);
};

const jobInput = (id: string) => ({
  id,
  model: "v8.0.0",
  projectId: "p1",
  shotId: "s1",
  trackId: "t1",
  clipId: "c1",
  assetId: "a1",
  request: { prompt: "a cat" }
});

afterEach(async () => {
  for (const manager of managers.splice(0)) manager.close();
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe("CloudRenderJobRepository", () => {
  test("creates a job that starts pending and carries its request", async () => {
    const repository = await openLibrary();
    await repository.create(jobInput("job-1"));

    const job = await repository.get("job-1");
    expect(job?.status).toBe("PENDING");
    expect(job?.progress).toBe(0);
    expect(job?.request).toEqual({ prompt: "a cat" });
    expect(job?.cloudAssetId).toBeNull();
  });

  test("lists only jobs still worth watching", async () => {
    const repository = await openLibrary();
    await repository.create(jobInput("job-1"));
    await repository.create(jobInput("job-2"));
    await repository.update("job-2", { status: "SUCCESS", finished: true });

    const active = await repository.listActive();
    expect(active.map((job) => job.id)).toEqual(["job-1"]);
  });

  test("lists an active job with its current progress for the pollers", async () => {
    const repository = await openLibrary();
    await repository.create(jobInput("job-1"));
    await repository.update("job-1", { status: "INPROGRESS", progress: 42 });

    const [active] = await repository.listActive();
    expect(active?.progress).toBe(42);
  });

  test("exposes the stored cloud output layer id in queue history", async () => {
    const repository = await openLibrary();
    await repository.create({
      ...jobInput("job-1"),
      request: { frameRange: [0, 4], cloudOutputLayerId: "cloud-layer-1" }
    });
    await repository.create({
      ...jobInput("job-2"),
      request: { frameRange: [0, 4] }
    });

    const queue = await repository.listQueue();
    const layerIdForJob = (jobId: string) =>
      queue.find((item) => item.id === jobId)?.cloud_output_layer_id;
    expect(layerIdForJob("job-1")).toBe("cloud-layer-1");
    expect(layerIdForJob("job-2")).toBeNull();
  });

  test("keeps completed jobs in queue history", async () => {
    const repository = await openLibrary();
    await repository.create({
      ...jobInput("job-1"),
      cloudAssetId: "cloud-asset",
      request: { frameRange: [4, 12] }
    });
    await repository.update("job-1", {
      status: "SUCCESS",
      progress: 100,
      finished: true
    });

    expect(await repository.listQueue()).toEqual([
      expect.objectContaining({
        id: "job-1",
        cloud_asset_id: "cloud-asset",
        asset_id: "a1",
        project_id: "p1",
        timeline_id: "s1",
        layer_id: "t1",
        frame_range: [4, 12],
        render_provider: "mago-cloud",
        status: "FINISHED",
        progress: 100,
        active: false
      })
    ]);
  });

  test("lists an image job with its clip, frame and settings, so reuse can find it", async () => {
    const repository = await openLibrary();
    const settings = { render_model: "nanobanana_pro", input_image_id: "a0" };
    await repository.create({
      ...jobInput("job-1"),
      cloudAssetId: "cloud-image",
      request: { kind: "img2img", frame: 12, settings }
    });

    expect(await repository.listQueue()).toEqual([
      expect.objectContaining({
        id: "job-1",
        cloud_asset_id: "cloud-image",
        clip_id: "c1",
        kind: "image",
        data: { frame: 12, settings, status: "PENDING" }
      })
    ]);
  });

  test("keeps in-flight statuses in the active list", async () => {
    const repository = await openLibrary();
    await repository.create(jobInput("job-1"));

    for (const status of ["INQUEUE", "INPROGRESS"]) {
      await repository.update("job-1", { status });
      expect((await repository.listActive()).map((job) => job.id)).toEqual([
        "job-1"
      ]);
    }
  });

  test("records the cloud asset id once the submission returns", async () => {
    const repository = await openLibrary();
    await repository.create(jobInput("job-1"));

    await repository.update("job-1", {
      cloudAssetId: "cloud-asset",
      status: "INQUEUE",
      progress: 10
    });

    const job = await repository.get("job-1");
    expect(job?.cloudAssetId).toBe("cloud-asset");
    expect(job?.status).toBe("INQUEUE");
    expect(job?.progress).toBe(10);
  });

  test("stores a failure message without losing the job", async () => {
    const repository = await openLibrary();
    await repository.create(jobInput("job-1"));

    await repository.update("job-1", {
      status: "FAILED",
      error: "Out of credits",
      finished: true
    });

    const job = await repository.get("job-1");
    expect(job?.status).toBe("FAILED");
    expect(job?.error).toBe("Out of credits");
    expect(await repository.listActive()).toEqual([]);
  });

  test("leaves untouched fields alone on a partial update", async () => {
    const repository = await openLibrary();
    await repository.create(jobInput("job-1"));
    await repository.update("job-1", {
      cloudAssetId: "cloud-asset",
      progress: 50
    });

    await repository.update("job-1", { status: "INPROGRESS" });

    const job = await repository.get("job-1");
    expect(job?.cloudAssetId).toBe("cloud-asset");
    expect(job?.progress).toBe(50);
  });

  test("returns null for a job that does not exist", async () => {
    const repository = await openLibrary();

    expect(await repository.get("missing")).toBeNull();
  });

  test("survives a request payload that is not an object", async () => {
    const repository = await openLibrary();
    await repository.create({
      ...jobInput("job-1"),
      request: [] as unknown as Record<string, unknown>
    });

    expect((await repository.get("job-1"))?.request).toEqual({});
  });

  test("cancels an in-flight job together with its asset and clip", async () => {
    const repository = await openLibrary();
    await repository.create(jobInput("job-1"));
    await repository.update("job-1", { status: "INQUEUE" });

    await repository.cancelActive("job-1");

    expect((await repository.get("job-1"))?.status).toBe("CANCELLED");
    expect(await repository.listActive()).toEqual([]);
    const [asset] = await managers[0]
      .get()
      .select()
      .from(assets)
      .where(eq(assets.id, "a1"));
    expect(asset.status).toBe("CANCELLED");
    expect(JSON.parse(asset.dataJson)).toMatchObject({
      queue_status: "CANCELLED"
    });
    const [clip] = await managers[0]
      .get()
      .select()
      .from(clips)
      .where(eq(clips.id, "c1"));
    expect(JSON.parse(clip.dataJson)).toMatchObject({ status: "cancelled" });
  });

  test("leaves a finished job alone when asked to cancel it", async () => {
    const repository = await openLibrary();
    await repository.create(jobInput("job-1"));
    await repository.update("job-1", { status: "SUCCESS", finished: true });

    await repository.cancelActive("job-1");
    await repository.cancelActive("missing");

    expect((await repository.get("job-1"))?.status).toBe("SUCCESS");
  });

  test("marks a job interacted in queue history", async () => {
    const repository = await openLibrary();
    await repository.create(jobInput("job-1"));

    await repository.markInteracted("job-1");

    expect(await repository.listQueue()).toEqual([
      expect.objectContaining({ id: "job-1", interacted_with: true })
    ]);
  });

  test("forgets a job when its clip goes away", async () => {
    const repository = await openLibrary();
    await repository.create(jobInput("job-1"));

    await repository.deleteForClip("c1");

    expect(await repository.get("job-1")).toBeNull();
  });
});
