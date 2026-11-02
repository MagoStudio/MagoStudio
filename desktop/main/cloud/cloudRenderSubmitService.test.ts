import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { eq } from "drizzle-orm";
import ffmpegPath from "ffmpeg-static";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("electron", () => ({
  app: { isPackaged: false, getAppPath: () => process.cwd() },
  nativeImage: { createFromPath: () => ({ isEmpty: () => true }) }
}));

import { DatabaseManager } from "../database/databaseManager";
import {
  assets,
  clips,
  cloudLinks,
  cloudRenderJobs,
  projectAssets,
  projects,
  shots,
  tracks
} from "../database/schema";

import { CloudRenderSubmitService } from "./cloudRenderSubmitService";

const directories: string[] = [];
const managers: DatabaseManager[] = [];

const openLibrary = async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "mago-cloud-submit-"));
  directories.push(directory);
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
    id: "output-track",
    shotId: "s1",
    projectId: "p1",
    name: "Cloud render",
    type: "RENDER",
    createdAt: now,
    updatedAt: now
  });
  await database.insert(assets).values({
    id: "source-asset",
    name: "source",
    type: "video",
    origin: "uploaded",
    sourcePath: "C:/videos/source.mp4",
    width: 1080,
    height: 1920,
    status: "available",
    createdAt: now,
    updatedAt: now
  });

  return {
    service: new CloudRenderSubmitService(manager, async () => directory),
    manager,
    directory
  };
};

const registration = {
  outputTrackId: "output-track",
  sourceAssetId: "source-asset",
  model: "v8.0.0",
  frameRange: [0, 40] as [number, number],
  fps: 24,
  cloudAssetId: "cloud-asset",
  settings: { resolution: 700 }
};

const imageRegistration = {
  projectId: "p1",
  shotId: "s1",
  sourceAssetId: "source-asset",
  model: "nanobanana_pro",
  frame: 12,
  name: "Shot image 1",
  cloudAssetId: "cloud-image",
  cloudClipId: "cloud-clip",
  settings: { render_model: "nanobanana_pro" }
};

const readClipData = async (
  manager: Awaited<ReturnType<typeof openLibrary>>["manager"],
  clipId: string
) => {
  const [clip] = await manager
    .get()
    .select()
    .from(clips)
    .where(eq(clips.id, clipId));
  return JSON.parse(clip?.dataJson ?? "{}");
};

const readAssetLink = async (
  manager: Awaited<ReturnType<typeof openLibrary>>["manager"],
  assetId: string
) => {
  const [link] = await manager
    .get()
    .select()
    .from(cloudLinks)
    .where(eq(cloudLinks.localId, assetId));
  return link
    ? {
        kind: link.kind,
        cloudId: link.cloudId,
        data: JSON.parse(link.dataJson)
      }
    : null;
};

const referenceSources = {
  images: [{ asset_id: "local-reference", type: "reference_frame" }]
};

const readAssetData = async (
  manager: Awaited<ReturnType<typeof openLibrary>>["manager"],
  assetId: string
) => {
  const [asset] = await manager
    .get()
    .select()
    .from(assets)
    .where(eq(assets.id, assetId));
  return JSON.parse(asset?.dataJson ?? "{}");
};

afterEach(async () => {
  for (const manager of managers.splice(0)) manager.close();
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe("CloudRenderSubmitService.register", () => {
  test("creates the local rows so the editor shows the job at once", async () => {
    const { service, manager } = await openLibrary();

    const result = await service.register(registration);

    const database = manager.get();
    const [asset] = await database
      .select()
      .from(assets)
      .where(eq(assets.id, result.assetId));
    const [clip] = await database
      .select()
      .from(clips)
      .where(eq(clips.id, result.clipId));
    const [job] = await database
      .select()
      .from(cloudRenderJobs)
      .where(eq(cloudRenderJobs.id, result.jobId));

    expect(asset?.status).toBe("PENDING");
    expect(asset?.frameCount).toBe(41);
    expect(clip?.trackId).toBe("output-track");
    expect(job?.status).toBe("PENDING");
    expect(job?.cloudAssetId).toBe("cloud-asset");
  });

  test("stores the reference sources on the placeholder asset, so reuse can restore them", async () => {
    const { service, manager } = await openLibrary();

    const result = await service.register({
      ...registration,
      sources: referenceSources
    });

    const assetData = await readAssetData(manager, result.assetId);
    expect(assetData.data.sources).toEqual(referenceSources);
    expect(assetData.data.render_settings.magov2).toEqual({ resolution: 700 });
  });

  test("records the crop area on the clip, so the track shows as a cropped render", async () => {
    const { service, manager } = await openLibrary();
    const cropSettings = {
      crop_coordinates: { top_left: [10, 20], bottom_right: [410, 320] },
      source_video_dimensions: [1080, 1920]
    };

    const result = await service.register({
      ...registration,
      settings: { ...registration.settings, ...cropSettings }
    });

    expect(await readClipData(manager, result.clipId)).toMatchObject(
      cropSettings
    );
  });

  test("records no crop area for an uncropped render", async () => {
    const { service, manager } = await openLibrary();

    const result = await service.register(registration);

    const clipData = await readClipData(manager, result.clipId);
    expect(clipData).not.toHaveProperty("crop_coordinates");
    expect(clipData).not.toHaveProperty("source_video_dimensions");
  });

  test("stores the cloud output layer id on the job request", async () => {
    const { service, manager } = await openLibrary();

    const result = await service.register({
      ...registration,
      cloudOutputLayerId: "cloud-output-layer"
    });

    const [job] = await manager
      .get()
      .select()
      .from(cloudRenderJobs)
      .where(eq(cloudRenderJobs.id, result.jobId));
    expect(JSON.parse(job?.requestJson ?? "{}").cloudOutputLayerId).toBe(
      "cloud-output-layer"
    );
  });

  test("stores no cloud output layer id when none is given", async () => {
    const { service, manager } = await openLibrary();

    const result = await service.register(registration);

    const [job] = await manager
      .get()
      .select()
      .from(cloudRenderJobs)
      .where(eq(cloudRenderJobs.id, result.jobId));
    expect(JSON.parse(job?.requestJson ?? "{}")).not.toHaveProperty(
      "cloudOutputLayerId"
    );
  });

  test("marks the placeholder asset as a cloud render", async () => {
    const { service, manager } = await openLibrary();
    const result = await service.register(registration);

    const [asset] = await manager
      .get()
      .select()
      .from(assets)
      .where(eq(assets.id, result.assetId));
    const data = JSON.parse(asset!.dataJson) as Record<string, unknown>;

    expect(data.render_target).toBe("cloud");
    expect(data.cloud_asset_id).toBe("cloud-asset");
    expect(data.queue_status).toBe("PENDING");
  });

  test("derives duration and fps from the frame range", async () => {
    const { service, manager } = await openLibrary();
    const result = await service.register(registration);

    const [asset] = await manager
      .get()
      .select()
      .from(assets)
      .where(eq(assets.id, result.assetId));

    // 41 frames at 24fps.
    expect(asset?.duration).toBe(1708);
    expect(asset?.fps).toBe(24_000);
  });

  test("inherits the source dimensions when none are given", async () => {
    const { service, manager } = await openLibrary();
    const result = await service.register(registration);

    const [asset] = await manager
      .get()
      .select()
      .from(assets)
      .where(eq(assets.id, result.assetId));

    expect(asset?.width).toBe(1080);
    expect(asset?.height).toBe(1920);
  });

  test("prefers explicit output dimensions, which a cloud render may change", async () => {
    const { service, manager } = await openLibrary();
    const result = await service.register({
      ...registration,
      width: 704,
      height: 1280
    });

    const [asset] = await manager
      .get()
      .select()
      .from(assets)
      .where(eq(assets.id, result.assetId));

    expect(asset?.width).toBe(704);
    expect(asset?.height).toBe(1280);
  });

  test("sizes an Image-to-Video output from its start image and resolution, and records the image as the source", async () => {
    const { service, manager } = await openLibrary();
    const now = new Date();
    await manager.get().insert(assets).values({
      id: "start-image",
      name: "start",
      type: "image",
      origin: "uploaded",
      sourcePath: "C:/images/start.png",
      width: 1920,
      height: 1080,
      status: "available",
      createdAt: now,
      updatedAt: now
    });

    const result = await service.register({
      ...registration,
      sourceAssetId: "start-image",
      model: "seedance_2_i2v",
      frameRange: [0, 120],
      settings: { image_id: "start-image", resolution: "480p" }
    });

    const database = manager.get();
    const [asset] = await database
      .select()
      .from(assets)
      .where(eq(assets.id, result.assetId));
    const [clip] = await database
      .select()
      .from(clips)
      .where(eq(clips.id, result.clipId));

    expect(asset?.width).toBe(854);
    expect(asset?.height).toBe(480);
    expect(JSON.parse(clip!.dataJson).source).toBe("start-image");
  });

  test("associates the output with its project", async () => {
    const { service, manager } = await openLibrary();
    const result = await service.register(registration);

    const rows = await manager
      .get()
      .select()
      .from(projectAssets)
      .where(eq(projectAssets.assetId, result.assetId));

    expect(rows[0]?.projectId).toBe("p1");
  });

  test("offsets the clip by where the render starts", async () => {
    const { service, manager } = await openLibrary();
    const result = await service.register({
      ...registration,
      frameRange: [48, 96]
    });

    const [clip] = await manager
      .get()
      .select()
      .from(clips)
      .where(eq(clips.id, result.clipId));

    // Frame 48 at 24fps is two seconds in.
    expect(clip?.timelineOffset).toBe(2000);
  });

  test("refuses an unknown output track or source asset", async () => {
    const { service } = await openLibrary();

    await expect(
      service.register({ ...registration, outputTrackId: "missing" })
    ).rejects.toThrow(/output track/);
    await expect(
      service.register({ ...registration, sourceAssetId: "missing" })
    ).rejects.toThrow(/source asset/);
  });

  test("writes nothing at all when the transaction cannot complete", async () => {
    const { service, manager } = await openLibrary();

    await expect(
      service.register({ ...registration, outputTrackId: "missing" })
    ).rejects.toThrow();

    // No orphan asset left behind by a failed submit.
    const remaining = await manager.get().select().from(assets);
    expect(remaining.map((asset) => asset.id)).toEqual(["source-asset"]);
  });
});

describe("CloudRenderSubmitService.complete", () => {
  test("turns the placeholder into an ordinary local asset", async () => {
    const { service, manager, directory } = await openLibrary();
    const result = await service.register(registration);

    await service.complete({
      jobId: result.jobId,
      relativePath: `renders/cloud/${result.jobId}/output.mp4`,
      sizeBytes: 289_312
    });

    const [asset] = await manager
      .get()
      .select()
      .from(assets)
      .where(eq(assets.id, result.assetId));
    const [job] = await manager
      .get()
      .select()
      .from(cloudRenderJobs)
      .where(eq(cloudRenderJobs.id, result.jobId));

    expect(asset?.status).toBe("available");
    expect(asset?.sizeBytes).toBe(289_312);
    expect(asset?.relativeSourcePath).toContain("renders/cloud");
    expect(asset?.sourcePath).toContain(directory);
    expect(JSON.parse(asset!.dataJson)).toMatchObject({
      queue_status: "FINISHED",
      cloud_asset_id: "cloud-asset",
      data: { render_settings: { magov2: registration.settings } }
    });
    expect(job?.status).toBe("SUCCESS");
    expect(job?.progress).toBe(100);
  });

  test("takes the asset and clip length from the video the cloud delivered", async () => {
    const { service, manager, directory } = await openLibrary();
    const minimaxReferenceRequestedFrameRange: [number, number] = [0, 40];
    const backendSnappedFrameCount = 56;
    const result = await service.register({
      ...registration,
      model: "v9.1.0",
      frameRange: minimaxReferenceRequestedFrameRange
    });
    const relativePath = `renders/cloud/${result.jobId}/output.mp4`;
    await mkdir(path.dirname(path.join(directory, relativePath)), {
      recursive: true
    });
    spawnSync(ffmpegPath!, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "testsrc=size=64x48:rate=24",
      "-frames:v",
      String(backendSnappedFrameCount),
      "-pix_fmt",
      "yuv420p",
      path.join(directory, relativePath)
    ]);

    await service.complete({ jobId: result.jobId, relativePath, sizeBytes: 1 });

    const [asset] = await manager
      .get()
      .select()
      .from(assets)
      .where(eq(assets.id, result.assetId));
    const [clip] = await manager
      .get()
      .select()
      .from(clips)
      .where(eq(clips.id, result.clipId));
    expect(asset).toMatchObject({
      frameCount: backendSnappedFrameCount,
      duration: Math.round((backendSnappedFrameCount / 24) * 1000),
      fps: 24_000,
      width: 64,
      height: 48
    });
    expect(JSON.parse(clip!.dataJson).frame_range).toEqual([
      0,
      backendSnappedFrameCount - 1
    ]);
    expect(JSON.parse(asset!.dataJson).output_size).toEqual([64, 48]);
  });

  test("keeps the registered length when the delivered video cannot be read", async () => {
    const { service, manager } = await openLibrary();
    const result = await service.register(registration);

    await service.complete({
      jobId: result.jobId,
      relativePath: `renders/cloud/${result.jobId}/output.mp4`,
      sizeBytes: 1
    });

    const [asset] = await manager
      .get()
      .select()
      .from(assets)
      .where(eq(assets.id, result.assetId));
    const [clip] = await manager
      .get()
      .select()
      .from(clips)
      .where(eq(clips.id, result.clipId));
    expect(asset?.frameCount).toBe(41);
    expect(JSON.parse(clip!.dataJson).frame_range).toEqual([0, 40]);
  });

  test("keeps the reference sources once the render finishes", async () => {
    const { service, manager } = await openLibrary();
    const result = await service.register({
      ...registration,
      sources: referenceSources
    });

    await service.complete({
      jobId: result.jobId,
      relativePath: `renders/cloud/${result.jobId}/output.mp4`,
      sizeBytes: 1
    });

    const assetData = await readAssetData(manager, result.assetId);
    expect(assetData.data.sources).toEqual(referenceSources);
  });

  test("links the output to its cloud layer, so rendering from it again uploads nothing", async () => {
    const { service, manager } = await openLibrary();
    const result = await service.register({
      ...registration,
      cloudOutputLayerId: "cloud-output-layer"
    });

    await service.complete({
      jobId: result.jobId,
      relativePath: `renders/cloud/${result.jobId}/output.mp4`,
      sizeBytes: 1
    });

    expect(await readAssetLink(manager, result.assetId)).toEqual({
      kind: "asset",
      cloudId: "cloud-asset",
      data: {
        origin: "cloud",
        status: "ingested",
        cloudLayerId: "cloud-output-layer"
      }
    });
  });

  test("leaves a video output unlinked when its cloud layer is unknown", async () => {
    const { service, manager } = await openLibrary();
    const result = await service.register(registration);

    await service.complete({
      jobId: result.jobId,
      relativePath: `renders/cloud/${result.jobId}/output.mp4`,
      sizeBytes: 1
    });

    expect(await readAssetLink(manager, result.assetId)).toBeNull();
  });

  test("links an image output to its cloud asset, so using it as an input uploads nothing", async () => {
    const { service, manager } = await openLibrary();
    const result = await service.registerImage(imageRegistration);

    await service.complete({
      jobId: result.jobId,
      relativePath: `renders/cloud/${result.jobId}/output.png`,
      sizeBytes: 1
    });

    expect(await readAssetLink(manager, result.assetId)).toEqual({
      kind: "asset",
      cloudId: "cloud-image",
      data: { origin: "cloud", status: "ingested", kind: "image" }
    });
  });

  test("refuses to complete a job it does not know", async () => {
    const { service } = await openLibrary();

    await expect(
      service.complete({
        jobId: "missing",
        relativePath: "renders/cloud/x/output.mp4",
        sizeBytes: 1
      })
    ).rejects.toThrow(/could not be found/);
  });
});

describe("CloudRenderSubmitService.fail", () => {
  test("records the failure on both the job and the asset", async () => {
    const { service, manager } = await openLibrary();
    const result = await service.register(registration);

    await service.fail({ jobId: result.jobId, message: "Out of credits" });

    const [asset] = await manager
      .get()
      .select()
      .from(assets)
      .where(eq(assets.id, result.assetId));
    const [job] = await manager
      .get()
      .select()
      .from(cloudRenderJobs)
      .where(eq(cloudRenderJobs.id, result.jobId));

    expect(asset?.status).toBe("FAILED");
    expect(JSON.parse(asset!.dataJson)).toMatchObject({
      queue_status: "ERROR",
      cloud_asset_id: "cloud-asset",
      error: { message: "Out of credits" },
      data: { render_settings: { magov2: registration.settings } }
    });
    expect(job?.status).toBe("FAILED");
    expect(job?.error).toBe("Out of credits");
  });

  test("never removes the local asset, whatever the cloud says", async () => {
    // The cloud copy is derived and disposable; the local library is not. A lost
    // or 404-ing cloud record must leave the local asset in place, marked, so the
    // user still has their timeline.
    const { service, manager } = await openLibrary();
    const result = await service.register(registration);

    await service.fail({ jobId: result.jobId, message: "gone from the cloud" });

    const remaining = await manager.get().select().from(assets);
    expect(remaining.map((asset) => asset.id).sort()).toEqual(
      ["source-asset", result.assetId].sort()
    );
    const [clip] = await manager
      .get()
      .select()
      .from(clips)
      .where(eq(clips.id, result.clipId));
    expect(clip).toBeDefined();
  });

  test("marks a failed image render's clip as failed, so its placeholder stops spinning", async () => {
    const { service, manager } = await openLibrary();
    const result = await service.registerImage(imageRegistration);

    await service.fail({ jobId: result.jobId, message: "Out of credits" });

    expect(await readClipData(manager, result.clipId)).toMatchObject({
      frame: 12,
      status: "failed",
      error: "Out of credits"
    });
  });

  test("is a no-op for an unknown job rather than throwing", async () => {
    // Failure handling must never itself fail and mask the original error.
    const { service } = await openLibrary();

    await expect(
      service.fail({ jobId: "missing", message: "whatever" })
    ).resolves.toBeUndefined();
  });
});
