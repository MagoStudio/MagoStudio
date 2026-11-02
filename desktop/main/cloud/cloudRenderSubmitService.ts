import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { and, asc, eq } from "drizzle-orm";
import { nativeImage } from "electron";

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
import {
  isLocalImageToVideoModelName,
  resolveImageToVideoResolution
} from "../imageRenders/imageToVideoModels";
import { estimateImageToVideoOutputDimensions } from "../imageRenders/imageToVideoOutputDimensions";
import { atomicWriteFile } from "../storage/atomicFile";

import { readStoredCloudOutputLayerId } from "./cloudRenderJobRepository";
import { renderOutputPath } from "./downloadRenderOutput";
import { RenderedVideoMetadata } from "./parseRenderedVideoMetadata";
import { probeRenderedVideoMetadata } from "./probeRenderedVideoMetadata";
import { toCloudRenderOutputLinkData } from "./toCloudRenderOutputLinkData";
import { toDeliveredFrameRange } from "./toDeliveredFrameRange";
import { toDeliveredVideoAssetFields } from "./toDeliveredVideoAssetFields";
import { toRenderCropClipFields } from "./toRenderCropClipFields";

/**
 * Creates the local rows for a render that runs in the cloud.
 *
 * The rows are written at submit time, in one transaction, so the editor shows
 * the job immediately without waiting on the cloud — the same thing
 * `ImageRenderService.submitVideo` does for a local render, and the reason a
 * cloud render feels no different in the UI.
 *
 * The renderer has already submitted to cloud Mago by this point and passes the
 * cloud ids in; nothing here talks to the network.
 */

export interface CloudRenderRegistration {
  outputTrackId: string;
  sourceAssetId: string;
  model: string;
  frameRange: [number, number];
  fps: number;
  cloudAssetId: string;
  cloudClipId?: string | null;
  cloudOutputLayerId?: string | null;
  settings: Record<string, unknown>;
  sources?: Record<string, unknown>;
  width?: number;
  height?: number;
}

export interface CloudImageRenderRegistration {
  projectId: string;
  shotId: string;
  sourceAssetId: string;
  model: string;
  /** The frame of the source the still was generated from. */
  frame: number;
  name: string;
  cloudAssetId: string;
  /**
   * img2img has no project-wide queue the way video does -- status comes from
   * `GET /assets/img2img/status/{clipId}`, keyed by this rather than by
   * `cloudAssetId`. Without it the poller has nothing to ask about, which is
   * why an img2img render used to sit PENDING forever even after the backend
   * finished it.
   */
  cloudClipId: string;
  settings: Record<string, unknown>;
}

const MS_PER_SECOND = 1000;
const FPS_SCALE = 1000;
/** Matching the local image path, so both look the same in the library. */
const THUMBNAIL_WIDTH = 480;
const THUMBNAIL_JPEG_QUALITY = 82;

type JsonRecord = Record<string, unknown>;

const asRecord = (value: unknown): JsonRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};

const parseRecord = (value: string | null | undefined): JsonRecord => {
  try {
    return asRecord(JSON.parse(value ?? "{}"));
  } catch {
    return {};
  }
};

const cloudAssetData = (input: {
  existingDataJson: string | null | undefined;
  cloudAssetId: string | null | undefined;
  queueStatus: "SUCCESS" | "FAILED";
  settings?: unknown;
  outputSize?: [number, number];
  error?: string;
}): JsonRecord => {
  const existing = parseRecord(input.existingDataJson);
  const existingData = asRecord(existing.data);
  const existingRenderSettings = asRecord(existingData.render_settings);
  const settings = input.settings ?? existingRenderSettings.magov2;
  const result: JsonRecord = {
    ...existing,
    origin: "generated",
    // Asset data is consumed by the shared frontend schema, whose terminal
    // statuses are FINISHED/ERROR. The job table keeps SUCCESS/FAILED.
    queue_status: input.queueStatus === "SUCCESS" ? "FINISHED" : "ERROR",
    render_target: "cloud"
  };

  if (input.cloudAssetId) result.cloud_asset_id = input.cloudAssetId;
  if (input.outputSize) result.output_size = input.outputSize;

  if (settings !== undefined) {
    result.data = {
      ...existingData,
      render_settings: {
        ...existingRenderSettings,
        magov2: settings
      }
    };
  }

  if (input.error) result.error = { message: input.error };
  else delete result.error;
  return result;
};

/**
 * Marks a job as producing a still rather than a video, so `complete` knows
 * what extension to download it under and what asset type to leave behind.
 * Stored in the job's request rather than a new column, because the request is
 * already the place per-job detail lives.
 */
export const IMAGE_JOB_KIND = "img2img";
export const IMAGE_OUTPUT_EXTENSION = "png";

/** Whether a stored job request describes an img2img render. */
export const isImageJobRequest = (
  request: Record<string, unknown> | undefined
): boolean => request?.kind === IMAGE_JOB_KIND;

export class CloudRenderSubmitService {
  constructor(
    private readonly manager: DatabaseManager,
    private readonly getLibraryRoot: () => Promise<string | null>,
    /** Told about every downloaded image render, e.g. to caption it. Must not throw. */
    private readonly onImageAvailable?: (assetId: string) => void,
    private readonly probeRenderedVideo: (
      filePath: string
    ) => Promise<RenderedVideoMetadata | null> = probeRenderedVideoMetadata
  ) {}

  async register(
    input: CloudRenderRegistration
  ): Promise<{ jobId: string; assetId: string; clipId: string }> {
    if (!this.manager.isOpen()) {
      throw new Error("Choose a Mago library folder first");
    }
    const libraryRoot = await this.getLibraryRoot();
    if (!libraryRoot) throw new Error("Choose a Mago library folder first");

    const database = this.manager.get();
    const [outputTrack] = await database
      .select()
      .from(tracks)
      .where(and(eq(tracks.id, input.outputTrackId), eq(tracks.active, true)))
      .limit(1);
    if (!outputTrack) throw new Error("The output track could not be found");

    const [sourceAsset] = await database
      .select()
      .from(assets)
      .where(eq(assets.id, input.sourceAssetId))
      .limit(1);
    if (!sourceAsset) throw new Error("The source asset could not be found");
    const estimatedOutputDimensions = isLocalImageToVideoModelName(input.model)
      ? estimateImageToVideoOutputDimensions(
          resolveImageToVideoResolution(input.model, input.settings.resolution),
          sourceAsset
        )
      : { width: sourceAsset.width, height: sourceAsset.height };

    const jobId = randomUUID();
    const assetId = randomUUID();
    const clipId = randomUUID();
    const now = new Date();
    const frameCount = input.frameRange[1] - input.frameRange[0] + 1;
    // Where the finished render will be downloaded to; the file does not exist
    // yet, and the asset stays PENDING until it does.
    const outputPath = path.join(libraryRoot, renderOutputPath(jobId));

    await this.manager.transaction(async (transaction) => {
      await transaction.insert(assets).values({
        id: assetId,
        name: outputTrack.name,
        type: "video",
        origin: "generated",
        sourcePath: outputPath,
        duration: Math.round((frameCount / input.fps) * MS_PER_SECOND),
        fps: Math.round(input.fps * FPS_SCALE),
        frameCount,
        width: input.width ?? estimatedOutputDimensions.width,
        height: input.height ?? estimatedOutputDimensions.height,
        status: "PENDING",
        dataJson: JSON.stringify({
          origin: "generated",
          queue_status: "PENDING",
          // Marks this as a cloud render so the UI can explain where it runs.
          render_target: "cloud",
          cloud_asset_id: input.cloudAssetId,
          data: {
            render_settings: { magov2: input.settings },
            ...(input.sources ? { sources: input.sources } : {})
          }
        }),
        createdAt: now,
        updatedAt: now
      });
      await transaction.insert(clips).values({
        id: clipId,
        trackId: outputTrack.id,
        assetId,
        name: outputTrack.name,
        timelineOffset: Math.round(
          (input.frameRange[0] / input.fps) * MS_PER_SECOND
        ),
        dataJson: JSON.stringify({
          status: "created",
          settings: input.settings,
          source: input.sourceAssetId,
          frame_range: input.frameRange,
          ...toRenderCropClipFields(input.settings)
        }),
        createdAt: now,
        updatedAt: now
      });
      await transaction.insert(projectAssets).values({
        projectId: outputTrack.projectId,
        assetId,
        createdAt: now
      });
      await transaction.insert(cloudRenderJobs).values({
        id: jobId,
        cloudAssetId: input.cloudAssetId,
        cloudClipId: input.cloudClipId ?? null,
        model: input.model,
        projectId: outputTrack.projectId,
        shotId: outputTrack.shotId,
        trackId: outputTrack.id,
        clipId,
        assetId,
        status: "PENDING",
        progress: 0,
        requestJson: JSON.stringify({
          frameRange: input.frameRange,
          fps: input.fps,
          settings: input.settings,
          ...(input.cloudOutputLayerId
            ? { cloudOutputLayerId: input.cloudOutputLayerId }
            : {})
        }),
        startedAt: now,
        createdAt: now,
        updatedAt: now
      });
    });

    return { jobId, assetId, clipId };
  }

  /**
   * The img2img counterpart of `register`.
   *
   * Differs from the video path in two ways, both matching what
   * `ImageRenderService.submit` does for a local image render: generated stills
   * share one `IMG2IMG` track per shot rather than getting a fresh layer each
   * time, and the clip records a single `frame` instead of a range. The cloud
   * backend creates its own output layer for img2img, so unlike the video path
   * there is no layer to make here first.
   */
  async registerImage(
    input: CloudImageRenderRegistration
  ): Promise<{ jobId: string; assetId: string; clipId: string }> {
    if (!this.manager.isOpen()) {
      throw new Error("Choose a Mago library folder first");
    }
    const libraryRoot = await this.getLibraryRoot();
    if (!libraryRoot) throw new Error("Choose a Mago library folder first");

    const jobId = randomUUID();
    const assetId = randomUUID();
    const clipId = randomUUID();
    const newTrackId = randomUUID();
    const now = new Date();
    const outputPath = path.join(
      libraryRoot,
      renderOutputPath(jobId, IMAGE_OUTPUT_EXTENSION)
    );

    await this.manager.transaction(async (transaction) => {
      const [shot] = await transaction
        .select()
        .from(shots)
        .where(
          and(eq(shots.id, input.shotId), eq(shots.projectId, input.projectId))
        )
        .limit(1);
      if (!shot) throw new Error("The local shot could not be found");

      const [existingTrack] = await transaction
        .select()
        .from(tracks)
        .where(and(eq(tracks.shotId, input.shotId), eq(tracks.type, "IMG2IMG")))
        .limit(1);
      const trackId = existingTrack?.id ?? newTrackId;
      if (!existingTrack) {
        const positions = await transaction
          .select({ position: tracks.position })
          .from(tracks)
          .where(eq(tracks.shotId, input.shotId))
          .orderBy(asc(tracks.position));
        await transaction.insert(tracks).values({
          id: trackId,
          shotId: input.shotId,
          projectId: input.projectId,
          name: "Generated images",
          type: "IMG2IMG",
          position: positions.length,
          createdAt: now,
          updatedAt: now
        });
      }

      await transaction.insert(assets).values({
        id: assetId,
        name: input.name,
        type: "image",
        origin: "generated",
        sourcePath: outputPath,
        status: "PENDING",
        dataJson: JSON.stringify({
          origin: "generated",
          queue_status: "PENDING",
          render_target: "cloud",
          cloud_asset_id: input.cloudAssetId,
          data: { render_settings: { magov2: input.settings } }
        }),
        createdAt: now,
        updatedAt: now
      });
      await transaction.insert(clips).values({
        id: clipId,
        trackId,
        assetId,
        name: input.name,
        dataJson: JSON.stringify({
          frame: input.frame,
          status: "created",
          settings: input.settings,
          source: input.sourceAssetId
        }),
        createdAt: now,
        updatedAt: now
      });
      await transaction.insert(projectAssets).values({
        projectId: input.projectId,
        assetId,
        createdAt: now
      });
      await transaction.insert(cloudRenderJobs).values({
        id: jobId,
        cloudAssetId: input.cloudAssetId,
        cloudClipId: input.cloudClipId,
        model: input.model,
        projectId: input.projectId,
        shotId: input.shotId,
        trackId,
        clipId,
        assetId,
        status: "PENDING",
        progress: 0,
        requestJson: JSON.stringify({
          kind: IMAGE_JOB_KIND,
          frame: input.frame,
          settings: input.settings
        }),
        startedAt: now,
        createdAt: now,
        updatedAt: now
      });
      await transaction
        .update(projects)
        .set({ updatedAt: now })
        .where(eq(projects.id, input.projectId));
    });

    return { jobId, assetId, clipId };
  }

  /**
   * Turns a downloaded render into an ordinary local asset. Called after the
   * output has actually landed on disk, so playback works offline from here on.
   */
  async complete(input: {
    jobId: string;
    relativePath: string;
    sizeBytes: number;
  }): Promise<void> {
    const libraryRoot = await this.getLibraryRoot();
    if (!libraryRoot) throw new Error("Choose a Mago library folder first");

    const database = this.manager.get();
    const [job] = await database
      .select()
      .from(cloudRenderJobs)
      .where(eq(cloudRenderJobs.id, input.jobId))
      .limit(1);
    if (!job) throw new Error("The cloud render job could not be found");

    // `register` recorded the render settings under `data.render_settings.magov2`
    // -- the same place a local render keeps them, and what the timeline reads
    // the model name from (see getTrackRenderSettings.ts). Carrying it forward
    // here is what keeps the model name showing once the render finishes.
    let request: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(job.requestJson) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        request = parsed as Record<string, unknown>;
      }
    } catch {
      request = {};
    }
    const settings = request.settings;

    const [asset] = await database
      .select({ dataJson: assets.dataJson })
      .from(assets)
      .where(eq(assets.id, job.assetId))
      .limit(1);

    // A still needs the same finishing touches the local image path gives it
    // (completeImageBytes in imageRenderService.ts): a thumbnail to show in the
    // library, and real dimensions, neither of which a video render needs here
    // because its own pipeline supplies them.
    const isImage = isImageJobRequest(request);
    const absolutePath = path.join(libraryRoot, input.relativePath);
    let thumbnailRelativePath: string | undefined;
    let dimensions: { width: number; height: number } | undefined;
    if (isImage) {
      const image = nativeImage.createFromPath(absolutePath);
      if (!image.isEmpty()) {
        const size = image.getSize();
        dimensions = { width: size.width, height: size.height };
        const relative = path.join(
          "thumbnails",
          "assets",
          `${job.assetId}.jpg`
        );
        try {
          await mkdir(path.dirname(path.join(libraryRoot, relative)), {
            recursive: true
          });
          await atomicWriteFile(
            path.join(libraryRoot, relative),
            image
              .resize({ width: THUMBNAIL_WIDTH, quality: "good" })
              .toJPEG(THUMBNAIL_JPEG_QUALITY)
          );
          thumbnailRelativePath = relative;
        } catch {
          // A missing thumbnail is cosmetic; the render itself still landed.
          thumbnailRelativePath = undefined;
        }
      }
    }

    const deliveredVideo = isImage
      ? null
      : await this.probeRenderedVideo(absolutePath);
    const deliveredVideoAssetFields = deliveredVideo
      ? toDeliveredVideoAssetFields(deliveredVideo, request.fps)
      : {};
    const deliveredVideoOutputSize: [number, number] | undefined =
      deliveredVideo?.width && deliveredVideo.height
        ? [deliveredVideo.width, deliveredVideo.height]
        : undefined;
    const cloudOutputLayerId = readStoredCloudOutputLayerId(request);
    const isCloudOutputUsableAsCloudRenderInput =
      isImage || !!cloudOutputLayerId;

    const now = new Date();
    await this.manager.transaction(async (transaction) => {
      await transaction
        .update(assets)
        .set({
          sourcePath: absolutePath,
          relativeSourcePath: input.relativePath,
          sizeBytes: input.sizeBytes,
          status: "available",
          ...(dimensions ?? {}),
          ...deliveredVideoAssetFields,
          ...(thumbnailRelativePath ? { thumbnailRelativePath } : {}),
          dataJson: JSON.stringify(
            cloudAssetData({
              existingDataJson: asset?.dataJson,
              cloudAssetId: job.cloudAssetId,
              queueStatus: "SUCCESS",
              settings,
              outputSize: deliveredVideoOutputSize
            })
          ),
          updatedAt: now
        })
        .where(eq(assets.id, job.assetId));
      if (job.cloudAssetId && isCloudOutputUsableAsCloudRenderInput) {
        const outputLinkDataJson = JSON.stringify(
          toCloudRenderOutputLinkData({ cloudOutputLayerId, isImage })
        );
        await transaction
          .insert(cloudLinks)
          .values({
            kind: "asset",
            localId: job.assetId,
            cloudId: job.cloudAssetId,
            syncedAt: now,
            dataJson: outputLinkDataJson,
            createdAt: now,
            updatedAt: now
          })
          .onConflictDoUpdate({
            target: [cloudLinks.kind, cloudLinks.localId],
            set: {
              cloudId: job.cloudAssetId,
              syncedAt: now,
              dataJson: outputLinkDataJson,
              updatedAt: now
            }
          });
      }
      if (isImage) {
        // The img2img UI reads the clip's status, not the asset's.
        const [clip] = await transaction
          .select()
          .from(clips)
          .where(eq(clips.id, job.clipId))
          .limit(1);
        let data: Record<string, unknown> = {};
        try {
          const parsed = JSON.parse(clip?.dataJson ?? "{}") as unknown;
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            data = parsed as Record<string, unknown>;
          }
        } catch {
          data = {};
        }
        await transaction
          .update(clips)
          .set({
            dataJson: JSON.stringify({
              ...data,
              status: "success",
              generated_at: now.toISOString()
            }),
            updatedAt: now
          })
          .where(eq(clips.id, job.clipId));
      }
      if (deliveredVideo) {
        const [clip] = await transaction
          .select({ dataJson: clips.dataJson })
          .from(clips)
          .where(eq(clips.id, job.clipId))
          .limit(1);
        const clipData = parseRecord(clip?.dataJson);
        const deliveredFrameRange = toDeliveredFrameRange(
          clipData.frame_range,
          deliveredVideo.frameCount
        );
        if (deliveredFrameRange) {
          await transaction
            .update(clips)
            .set({
              dataJson: JSON.stringify({
                ...clipData,
                frame_range: deliveredFrameRange
              }),
              updatedAt: now
            })
            .where(eq(clips.id, job.clipId));
        }
      }
      await transaction
        .update(cloudRenderJobs)
        .set({
          status: "SUCCESS",
          progress: 100,
          finishedAt: now,
          updatedAt: now
        })
        .where(eq(cloudRenderJobs.id, input.jobId));
    });
    if (isImage) this.onImageAvailable?.(job.assetId);
  }

  /** Records a failure against both the job and the placeholder asset. */
  async fail(input: { jobId: string; message: string }): Promise<void> {
    const database = this.manager.get();
    const [job] = await database
      .select()
      .from(cloudRenderJobs)
      .where(eq(cloudRenderJobs.id, input.jobId))
      .limit(1);
    if (!job) return;

    const [asset] = await database
      .select({ dataJson: assets.dataJson })
      .from(assets)
      .where(eq(assets.id, job.assetId))
      .limit(1);
    const isImage = isImageJobRequest(parseRecord(job.requestJson));

    const now = new Date();
    await this.manager.transaction(async (transaction) => {
      if (isImage) {
        const [clip] = await transaction
          .select({ dataJson: clips.dataJson })
          .from(clips)
          .where(eq(clips.id, job.clipId))
          .limit(1);
        await transaction
          .update(clips)
          .set({
            dataJson: JSON.stringify({
              ...parseRecord(clip?.dataJson),
              status: "failed",
              error: input.message
            }),
            updatedAt: now
          })
          .where(eq(clips.id, job.clipId));
      }
      await transaction
        .update(assets)
        .set({
          status: "FAILED",
          dataJson: JSON.stringify(
            cloudAssetData({
              existingDataJson: asset?.dataJson,
              cloudAssetId: job.cloudAssetId,
              queueStatus: "FAILED",
              error: input.message
            })
          ),
          updatedAt: now
        })
        .where(eq(assets.id, job.assetId));
      await transaction
        .update(cloudRenderJobs)
        .set({
          status: "FAILED",
          error: input.message,
          finishedAt: now,
          updatedAt: now
        })
        .where(eq(cloudRenderJobs.id, input.jobId));
    });
  }
}
