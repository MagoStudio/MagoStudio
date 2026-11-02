import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";

import { and, asc, eq, inArray } from "drizzle-orm";
import { nativeImage } from "electron";
import ffmpegPath from "ffmpeg-static";

import type {
  LocalImageRenderInput,
  LocalQueueItem,
  LocalVideoRenderInput
} from "../../shared/contracts";
import type { ComfyLivePrompt } from "../comfy/ComfyProgressMonitor";
import {
  comfyProgressMonitorFor,
  onAnyComfyPromptSettled
} from "../comfy/comfyProgressMonitors";
import { readComfyPromptWithSafetyPoll } from "../comfy/readComfyPromptWithSafetyPoll";
import { DatabaseManager } from "../database/databaseManager";
import {
  assets,
  clips,
  imageRenderJobs,
  projectAssets,
  projects,
  shots,
  tracks
} from "../database/schema";
import {
  clearLibraryIssue,
  reportLibraryIssue,
  runBackgroundTask
} from "../libraryHealth";
import { doesVideoHaveAudioStream } from "../media/doesVideoHaveAudioStream";
import { validateVideo } from "../media/validateVideo";
import {
  atomicWriteFile,
  atomicCopyFile,
  atomicProduceFile,
  publishFile
} from "../storage/atomicFile";

import { buildMiniMaxH3RenderRequest } from "./buildMiniMaxH3RenderRequest";
import { isComfyOutOfMemoryError } from "./comfyError";
import {
  ComfyLtxUpscaleClient,
  DEFAULT_LTX_TILE_SIZE,
  MAX_LTX_TILE_SIZE,
  MIN_LTX_TILE_SIZE,
  type LtxUpscaleFactor
} from "./comfyLtxUpscaleClient";
import {
  clampMiniMaxH3Dimension,
  ComfyMiniMaxH3Client,
  MINIMAX_H3_FPS
} from "./comfyMiniMaxH3Client";
import {
  assertComfyRenderModelReady,
  isComfyRenderModel
} from "./comfyModelValidation";
import { comfyProgressPercent } from "./comfyProgressPercent";
import {
  ComfyQwenClient,
  type ComfyPollResult,
  resolveQwenImageEditSetup
} from "./comfyQwenClient";
import { comfyRenderEta } from "./comfyRenderEta";
import { LOCAL_VIDEO_RENDER_CRF } from "./comfyVideoSave";
import {
  ComfyMagoAnimateClient,
  ComfyWanAnimateClient,
  ComfyWanFunControlClient,
  isMagoAnimateQuantisation,
  ComfyWanVaceClient,
  isWanFunQuantisation,
  type WanAnimateMode,
  type WanVaceVariant
} from "./comfyWanAnimateClient";
import {
  assertSourceDimensionsMatch,
  cropBackFilter,
  cropFilter,
  normalizeCrop,
  readCropCoordinates,
  readSourceDimensions,
  toCropBack,
  toCropCoordinates,
  type CropBack,
  type CropPlan,
  type CropRect
} from "./cropPlan";
import type { LocalImageToVideoModelName } from "./imageToVideoModels";
import { getUnfinishedQueuePositions } from "./queuePosition";
import { getRenderEta } from "./renderEta";
import { fitWanDimensions } from "./wanDimensions";

const ACTIVE_STATUSES = ["PENDING", "INQUEUE", "INPROGRESS"];
const MAX_IMAGE_BYTES = 67_108_864;
const MAX_INPUT_VIDEO_BYTES = 52_428_800;
const POLL_INTERVAL_MS = 3_000;
const QUEUED_PROGRESS = 10;
const RUNNING_PROGRESS = 50;
const THUMBNAIL_JPEG_QUALITY = 82;
const WAN_ANIMATE_MIN_FRAMES = 5;
const WAN_ANIMATE_FRAME_STRIDE = 4;
const WAN_VACE_MIN_FRAMES = 5;
const WAN_FALLBACK_SIZE = 640;
const WAN_PIXEL_ALIGNMENT = 16;
const LTX_UPSCALE_FACTOR_2: LtxUpscaleFactor = 2;
const LTX_UPSCALE_FACTOR_4: LtxUpscaleFactor = 4;
const LTX_DEFAULT_INPUT_DIMENSION = 1024;
const LTX_MIN_INPUT_DIMENSION = 64;
const LTX_MAX_INPUT_DIMENSION = 16_384;
const LTX_TRIM_ALIGNMENT = 32;
const LTX_MAX_LORA_STRENGTH = 1.5;
const MIN_TRIM_DURATION_SECONDS = 0.01;
const MAX_FFMPEG_ERROR_LENGTH = 2_000;
const QWEN_MULTI_REFERENCE_INSTRUCTION =
  "Preserve the content, composition, geometry, identity, and pose from @Image1. Apply only the visual style from the remaining reference images.";

export const buildPreparedVideoFilter = (
  targetFps?: number,
  inputCrop?: CropRect
): string => {
  const fps = targetFps ? `fps=${targetFps},` : "";
  const crop = inputCrop ? `${cropFilter(inputCrop)},` : "";
  return `${fps}${crop}scale=1280:1280:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`;
};

export const buildWanPreparedVideoFilter = (
  targetFps: number | undefined,
  targetWidth: number,
  targetHeight: number,
  motionStrength?: number,
  inputCrop?: CropRect,
  pixelAlignment = WAN_PIXEL_ALIGNMENT
): string => {
  const fps = targetFps ? `fps=${targetFps},` : "";
  const crop = inputCrop ? `${cropFilter(inputCrop)},` : "";
  const padToAlignment = (value: number) =>
    Math.max(
      pixelAlignment,
      Math.ceil(value / pixelAlignment) * pixelAlignment
    );
  const paddedWidth = padToAlignment(targetWidth);
  const paddedHeight = padToAlignment(targetHeight);
  const fitAndPad = `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${paddedWidth}:${paddedHeight}:0:0:color=black`;
  if (motionStrength === undefined) return `${fps}${crop}${fitAndPad}`;
  const strength = Math.max(0, Math.min(1, motionStrength));
  return `${fps}${crop}${fitAndPad},lutrgb=r=127+(val-127)*${strength}:g=127+(val-127)*${strength}:b=127+(val-127)*${strength}`;
};

export const buildVideoThumbnailArgs = (
  inputPath: string,
  outputPath: string
): string[] => [
  "-hide_banner",
  "-loglevel",
  "error",
  "-ss",
  "0",
  "-i",
  inputPath,
  "-map",
  "0:v:0",
  "-frames:v",
  "1",
  "-vf",
  "scale=480:-2:force_original_aspect_ratio=decrease",
  "-q:v",
  "3",
  "-y",
  outputPath
];

type StoredImageRequest = Omit<LocalImageRenderInput, "inputImage"> & {
  kind?: "image";
  inputRelativePath?: string;
  inputImageId?: string;
  comfyEndpoint?: string;
};

type StoredVideoRequest = LocalVideoRenderInput & {
  kind: "video";
  projectId: string;
  shotId: string;
  sourceAssetId: string;
  sourcePath: string;
  sourceStartSeconds: number;
  sourceEndSeconds: number;
  sourceThumbnailRelativePath?: string;
  name: string;
  inputRelativePath: string;
  comfyEndpoint?: string;
  inputCrop?: CropRect;
  cropBack?: CropBack;
};

type StoredImageToVideoRequest = LocalVideoRenderInput & {
  kind: "image-to-video";
  model: LocalImageToVideoModelName;
  projectId: string;
  shotId: string;
  name: string;
  startImageAssetId: string;
  endImageAssetId?: string;
};

type StoredRequest =
  | StoredImageRequest
  | StoredVideoRequest
  | StoredImageToVideoRequest;

type StoredVideoOutputRequest = StoredVideoRequest | StoredImageToVideoRequest;

type CompletableVideoRequest = Pick<
  StoredVideoRequest,
  "settings" | "cropBack" | "sourceThumbnailRelativePath"
>;

const isStoredVideoOutputRequest = (
  request: StoredRequest
): request is StoredVideoOutputRequest =>
  request.kind === "video" || request.kind === "image-to-video";

class InvalidRenderDataError extends Error {}
const parseJson = <T>(value: string): T => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error("Expected object");
    return parsed as T;
  } catch {
    throw new InvalidRenderDataError(
      "Saved render data is damaged. The original data has been kept."
    );
  }
};

const readRenderRequest = (value: string): StoredRequest => {
  const request = parseJson<StoredRequest>(value);
  if (
    !request.settings ||
    typeof request.settings !== "object" ||
    Array.isArray(request.settings) ||
    (request.referenceImageIds !== undefined &&
      (!Array.isArray(request.referenceImageIds) ||
        !request.referenceImageIds.every((id) => typeof id === "string")))
  )
    throw new InvalidRenderDataError(
      "Saved render settings are damaged. The original data has been kept."
    );
  return request;
};

const DEFAULT_RAW_VIDEO_CONTROL_STRENGTH = 0.5;

export const readBoundedNumber = (
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
};

export interface NumericSettingBounds {
  fallback: number;
  min: number;
  max: number;
}

export const VACE_SETTING_BOUNDS = {
  depthStrength: { fallback: 0.5, min: 0.1, max: 1 },
  poseStrength: { fallback: 0.5, min: 0.1, max: 1 }
} as const satisfies Record<string, NumericSettingBounds>;

export const FUN_CONTROL_SETTING_BOUNDS = {
  steps: { fallback: 4, min: 4, max: 20 },
  splitPercentage: { fallback: 40, min: 20, max: 80 },
  cfg: { fallback: 1, min: 0.5, max: 6 },
  shift: { fallback: 8, min: 1, max: 10 },
  speedupLoraStrength: { fallback: 1, min: 0, max: 1 },
  colorMatchStrength: { fallback: 0, min: 0, max: 1 }
} as const satisfies Record<string, NumericSettingBounds>;

export const readStringSetting = (value: unknown): string =>
  typeof value === "string" ? value : "";

const ANIMATE_CACHE_DTYPES = ["int8", "int4", "default"];

export const readAnimateCacheDtype = (
  settings: Record<string, unknown>
): string => {
  const raw = settings.animate_cache_dtype;
  return typeof raw === "string" && ANIMATE_CACHE_DTYPES.includes(raw)
    ? raw
    : "int8";
};

export const MAGO_ANIMATE_SETTING_BOUNDS = {
  steps: { fallback: 10, min: 2, max: 20 },
  cfg: { fallback: 1, min: 0.5, max: 6 },
  shift: { fallback: 5, min: 1, max: 10 },
  referenceImageStrength: { fallback: 1, min: 0, max: 2 },
  poseStrength: { fallback: 1, min: 0, max: 2 },
  poseStartPercent: { fallback: 0, min: 0, max: 1 },
  poseEndPercent: { fallback: 1, min: 0, max: 1 }
} as const satisfies Record<string, NumericSettingBounds>;

export const readBoundedSetting = (
  value: unknown,
  bounds: NumericSettingBounds
): number => readBoundedNumber(value, bounds.fallback, bounds.min, bounds.max);

export const readRawVideoControlStrength = (
  settings: Record<string, unknown>
): number =>
  readBoundedNumber(
    settings.raw_video_cn_strength,
    DEFAULT_RAW_VIDEO_CONTROL_STRENGTH,
    0,
    1
  );

export const planSettingsCrop = (
  settings: Record<string, unknown>,
  decodedDimensions: [number, number]
): { plan: CropPlan; sourceDimensions: [number, number] } | null => {
  const rawCropCoordinates = settings.crop_coordinates;
  if (rawCropCoordinates === undefined || rawCropCoordinates === null) {
    return null;
  }

  const cropCoordinates = readCropCoordinates(rawCropCoordinates);
  if (!cropCoordinates) {
    throw new Error(
      "The crop area is malformed. Redraw the crop area and render again."
    );
  }

  const declaredDimensions = readSourceDimensions(
    settings.source_video_dimensions
  );
  if (!declaredDimensions) {
    throw new Error(
      "The crop area is missing the video size it was drawn against. Redraw the crop area and render again."
    );
  }

  const [decodedWidth, decodedHeight] = decodedDimensions;
  if (decodedWidth <= 0 || decodedHeight <= 0) {
    throw new Error(
      "The input video's size is unknown, so the crop area cannot be applied safely. Re-import the video and try again."
    );
  }

  assertSourceDimensionsMatch(declaredDimensions, decodedDimensions);

  const plan = normalizeCrop(declaredDimensions, cropCoordinates);
  if (!plan) return null;
  return { plan, sourceDimensions: declaredDimensions };
};

export class ImageRenderService {
  private timer: NodeJS.Timeout | null = null;
  private processing = false;
  private isKickRequestedDuringProcessing = false;
  private stopListeningForComfySettles: (() => void) | null = null;
  private readonly comfyStatusCheckedAtByJobId = new Map<string, number>();

  constructor(
    private readonly manager: DatabaseManager,
    private readonly getLibraryRoot: () => Promise<string | null>,
    private readonly getComfyEndpoint: () => Promise<string>,
    /** Told about every image that lands, e.g. to caption it. Must not throw. */
    private readonly onImageAvailable?: (assetId: string) => void
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.scheduleKick(), POLL_INTERVAL_MS);
    this.timer.unref();
    this.stopListeningForComfySettles = onAnyComfyPromptSettled(() =>
      this.scheduleKick()
    );
    this.scheduleKick();
  }

  private scheduleKick(): void {
    void runBackgroundTask("Render polling", () => this.kick());
  }

  async reconcileInterruptedRenders(): Promise<void> {
    this.processing = true;
    try {
      const jobs = await this.manager.get().select().from(imageRenderJobs);
      const root = await this.requireLibraryRoot();
      for (const job of jobs) {
        const active = ACTIVE_STATUSES.includes(job.status);
        if (!active && job.status !== "FINISHED") continue;
        const [asset] = await this.manager
          .get()
          .select()
          .from(assets)
          .where(eq(assets.id, job.assetId))
          .limit(1);
        if (!asset) continue;
        try {
          if (active) readRenderRequest(job.requestJson);
          const file = await stat(asset.sourcePath).catch(
            (error: NodeJS.ErrnoException) => {
              if (error.code === "ENOENT") return null;
              throw error;
            }
          );
          if (!file?.isFile() || file.size === 0) {
            if (!active)
              throw new Error(
                "Completed render output is missing or empty. Locate the file or render again."
              );
            if (job.status !== "PENDING" && !job.providerRequestId)
              throw new Error(
                "Render was interrupted before its provider request was saved. Render again."
              );
            // Pending jobs can start; saved provider requests can resume polling.
            continue;
          }
          if (!active) continue;
          if (asset.type === "image") {
            const bytes = await readFile(asset.sourcePath);
            if (nativeImage.createFromBuffer(bytes).isEmpty())
              throw new Error("Interrupted render output is unreadable.");
            await this.completeImageBytes(job, bytes, "Recovered render");
          } else {
            await validateVideo(asset.sourcePath);
            const request = parseJson<CompletableVideoRequest>(job.requestJson);
            // The published output has already been cropped. Do not crop it twice.
            await this.completeVideoFile(
              job,
              { ...request, cropBack: undefined },
              asset.sourcePath
            );
          }
          clearLibraryIssue(`render:${job.id}`);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          reportLibraryIssue({
            id: `render:${job.id}`,
            kind: "asset",
            projectId: job.projectId,
            assetId: job.assetId,
            message
          });
          await this.finishWithStatus(
            job.id,
            job.assetId,
            job.clipId,
            "ERROR",
            "failed",
            message
          );
        }
      }
    } finally {
      this.processing = false;
    }
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.stopListeningForComfySettles?.();
    this.stopListeningForComfySettles = null;
  }

  async submit(input: LocalImageRenderInput): Promise<{ jobId: string }> {
    if (!this.manager.isOpen())
      throw new Error("Choose a Mago library folder first");
    if (input.model === "qwen") {
      await assertComfyRenderModelReady(
        await this.getComfyEndpoint(),
        input.model,
        input.settings
      );
      if (input.referenceImageIds.length > 2)
        throw new Error("Qwen Image Edit supports up to two reference images");
    } else {
      throw new Error(
        "This model requires Mago Cloud. Personal fal.ai keys are no longer supported."
      );
    }
    const root = await this.requireLibraryRoot();
    const jobId = randomUUID();
    const jobDirectory = path.join(root, "renders", "images", jobId);
    await mkdir(jobDirectory, { recursive: true });

    let inputRelativePath: string | undefined;
    if (input.inputImage) {
      const decoded = this.decodeDataImage(input.inputImage);
      inputRelativePath = path.join(
        "renders",
        "images",
        jobId,
        `input.${decoded.extension}`
      );
      await atomicWriteFile(path.join(root, inputRelativePath), decoded.bytes);
    }

    const now = new Date();
    const trackId = randomUUID();
    const clipId = randomUUID();
    const assetId = randomUUID();
    const outputPath = path.join(jobDirectory, "output.png");
    const safeSettings = { ...input.settings };
    delete safeSettings.input_image;
    const { inputImage: _inputImage, ...requestWithoutData } = {
      ...input,
      settings: safeSettings
    };
    const storedRequest: StoredRequest = {
      ...requestWithoutData,
      inputRelativePath
    };

    await this.manager.transaction(async (database) => {
      const [shot] = await database
        .select()
        .from(shots)
        .where(
          and(eq(shots.id, input.shotId), eq(shots.projectId, input.projectId))
        )
        .limit(1);
      if (!shot) throw new Error("Local shot not found");
      const [existingTrack] = await database
        .select()
        .from(tracks)
        .where(and(eq(tracks.shotId, input.shotId), eq(tracks.type, "IMG2IMG")))
        .limit(1);
      const actualTrackId = existingTrack?.id ?? trackId;
      if (!existingTrack) {
        const positions = await database
          .select({ position: tracks.position })
          .from(tracks)
          .where(eq(tracks.shotId, input.shotId))
          .orderBy(asc(tracks.position));
        await database.insert(tracks).values({
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
      await database.insert(assets).values({
        id: assetId,
        name: input.name,
        type: "image",
        origin: "generated",
        sourcePath: outputPath,
        status: "PENDING",
        dataJson: JSON.stringify({
          origin: "generated",
          queue_status: "PENDING"
        }),
        createdAt: now,
        updatedAt: now
      });
      await database.insert(clips).values({
        id: clipId,
        trackId: actualTrackId,
        assetId,
        name: input.name,
        dataJson: JSON.stringify({
          frame: input.frame,
          status: "created",
          settings: safeSettings,
          source: input.sourceAssetId
        }),
        createdAt: now,
        updatedAt: now
      });
      await database
        .insert(projectAssets)
        .values({ projectId: input.projectId, assetId, createdAt: now });
      await database.insert(imageRenderJobs).values({
        id: jobId,
        model: input.model,
        projectId: input.projectId,
        shotId: input.shotId,
        trackId: actualTrackId,
        clipId,
        assetId,
        requestJson: JSON.stringify(storedRequest),
        createdAt: now,
        updatedAt: now
      });
      await database
        .update(projects)
        .set({ updatedAt: now })
        .where(eq(projects.id, input.projectId));
    });
    this.scheduleKick();
    return { jobId };
  }

  async submitVideo(input: LocalVideoRenderInput): Promise<{ jobId: string }> {
    if (!this.manager.isOpen())
      throw new Error("Choose a Mago library folder first");
    if (isComfyRenderModel(input.model)) {
      const endpoint = await this.getComfyEndpoint();
      await assertComfyRenderModelReady(endpoint, input.model, input.settings);
      if (
        input.model === "ltx_2_3_spatial_upscaler" &&
        input.referenceImageIds.length !== 0
      )
        throw new Error("LTX spatial upscale does not use reference images");
      const isLocalWanVideoModel =
        input.model !== "ltx_2_3_spatial_upscaler" &&
        input.model !== "minimax_h3_local";
      if (isLocalWanVideoModel && input.referenceImageIds.length !== 1)
        throw new Error("Local Wan video models require one reference image");
    } else {
      throw new Error(
        "This model requires Mago Cloud. Personal fal.ai keys are no longer supported."
      );
    }
    const inputFrameCount = input.frameRange[1] - input.frameRange[0] + 1;
    if (
      input.model === "wan_animate_2_2" &&
      inputFrameCount < WAN_ANIMATE_MIN_FRAMES
    ) {
      throw new Error(
        `Wan2.2 Animate renders must be at least ${WAN_ANIMATE_MIN_FRAMES} frames`
      );
    }
    if (
      (input.model === "wan_vace_2_1" ||
        input.model === "mago_style_transfer_local" ||
        input.model === "mago_animate") &&
      inputFrameCount < WAN_VACE_MIN_FRAMES
    ) {
      throw new Error(
        `Wan VACE renders must be at least ${WAN_VACE_MIN_FRAMES} frames`
      );
    }
    const { inputTrackId } = input;
    if (!inputTrackId) throw new Error("The input track has no video clip");
    const database = this.manager.get();
    const [[outputTrack], [inputTrack]] = await Promise.all([
      database
        .select()
        .from(tracks)
        .where(eq(tracks.id, input.outputTrackId))
        .limit(1),
      database.select().from(tracks).where(eq(tracks.id, inputTrackId)).limit(1)
    ]);
    if (
      !outputTrack ||
      !inputTrack ||
      outputTrack.shotId !== inputTrack.shotId
    ) {
      throw new Error("Local render tracks are unavailable");
    }
    const [sourceClip] = await database
      .select()
      .from(clips)
      .where(eq(clips.trackId, inputTrackId))
      .limit(1);
    if (!sourceClip) throw new Error("The input track has no video clip");
    const [sourceAsset] = await database
      .select()
      .from(assets)
      .where(eq(assets.id, sourceClip.assetId))
      .limit(1);
    if (!sourceAsset || sourceAsset.type === "image")
      throw new Error("The input track has no local video");

    const root = await this.requireLibraryRoot();
    const jobId = randomUUID();
    const assetId = randomUUID();
    const clipId = randomUUID();
    const jobDirectory = path.join(root, "renders", "videos", jobId);
    const inputRelativePath = path.join(
      "renders",
      "videos",
      jobId,
      "input.mp4"
    );
    const outputPath = path.join(jobDirectory, "output.mp4");
    await mkdir(jobDirectory, { recursive: true });
    const durationMs = Math.round((inputFrameCount / input.fps) * 1000);
    const settingsWidth = input.settings.width;
    const settingsHeight = input.settings.height;
    const croppedRender = planSettingsCrop(input.settings, [
      sourceAsset.width ?? 0,
      sourceAsset.height ?? 0
    ]);
    const requestedOutputWidth = croppedRender
      ? croppedRender.plan.requested.w
      : typeof settingsWidth === "number" && Number.isFinite(settingsWidth)
        ? settingsWidth
        : sourceAsset.width;
    const requestedOutputHeight = croppedRender
      ? croppedRender.plan.requested.h
      : typeof settingsHeight === "number" && Number.isFinite(settingsHeight)
        ? settingsHeight
        : sourceAsset.height;
    const isMiniMaxH3Render = input.model === "minimax_h3_local";
    const outputWidth =
      isMiniMaxH3Render && typeof requestedOutputWidth === "number"
        ? clampMiniMaxH3Dimension(requestedOutputWidth)
        : requestedOutputWidth;
    const outputHeight =
      isMiniMaxH3Render && typeof requestedOutputHeight === "number"
        ? clampMiniMaxH3Dimension(requestedOutputHeight)
        : requestedOutputHeight;
    const sourceStartSeconds =
      (sourceClip.trimStart ?? 0) / 1000 +
      Math.max(
        0,
        input.frameRange[0] / input.fps - sourceClip.timelineOffset / 1000
      );
    const now = new Date();
    const storedRequest: StoredVideoRequest = {
      ...input,
      kind: "video",
      projectId: outputTrack.projectId,
      shotId: outputTrack.shotId,
      sourceAssetId: sourceAsset.id,
      sourcePath: sourceAsset.sourcePath,
      sourceStartSeconds,
      sourceEndSeconds: sourceStartSeconds + inputFrameCount / input.fps,
      sourceThumbnailRelativePath:
        sourceAsset.thumbnailRelativePath ?? undefined,
      name: outputTrack.name,
      inputRelativePath,
      inputCrop: croppedRender?.plan.inputCrop ?? undefined,
      cropBack: croppedRender
        ? toCropBack(croppedRender.plan, croppedRender.sourceDimensions)
        : undefined
    };

    await this.manager.transaction(async (transaction) => {
      await transaction.insert(assets).values({
        id: assetId,
        name: outputTrack.name,
        type: "video",
        origin: "generated",
        sourcePath: outputPath,
        duration: durationMs,
        fps: Math.round(input.fps * 1000),
        frameCount: inputFrameCount,
        width: outputWidth,
        height: outputHeight,
        status: "PENDING",
        dataJson: JSON.stringify({
          origin: "generated",
          queue_status: "PENDING",
          data: { render_settings: { magov2: input.settings } }
        }),
        createdAt: now,
        updatedAt: now
      });
      await transaction.insert(clips).values({
        id: clipId,
        trackId: outputTrack.id,
        assetId,
        name: outputTrack.name,
        timelineOffset: Math.round((input.frameRange[0] / input.fps) * 1000),
        dataJson: JSON.stringify({
          status: "created",
          settings: input.settings,
          source: sourceAsset.id,
          frame_range: input.frameRange,
          ...(croppedRender
            ? {
                crop_coordinates: toCropCoordinates(
                  croppedRender.plan.requested
                ),
                source_video_dimensions: croppedRender.sourceDimensions
              }
            : {})
        }),
        createdAt: now,
        updatedAt: now
      });
      await transaction
        .insert(projectAssets)
        .values({ projectId: outputTrack.projectId, assetId, createdAt: now });
      await transaction.insert(imageRenderJobs).values({
        id: jobId,
        model: input.model,
        projectId: outputTrack.projectId,
        shotId: outputTrack.shotId,
        trackId: outputTrack.id,
        clipId,
        assetId,
        requestJson: JSON.stringify(storedRequest),
        createdAt: now,
        updatedAt: now
      });
      await transaction
        .update(projects)
        .set({ updatedAt: now })
        .where(eq(projects.id, outputTrack.projectId));
    });
    this.scheduleKick();
    return { jobId };
  }

  async listQueue(): Promise<LocalQueueItem[]> {
    if (!this.manager.isOpen()) return [];
    const database = this.manager.get();
    const jobs = await database
      .select()
      .from(imageRenderJobs)
      .orderBy(asc(imageRenderJobs.createdAt));
    const unfinishedPositions = getUnfinishedQueuePositions(jobs);
    const now = new Date();
    return Promise.all(
      jobs.map(async (job, index) => {
        const [[project], [shot], [track]] = await Promise.all([
          database
            .select()
            .from(projects)
            .where(eq(projects.id, job.projectId))
            .limit(1),
          database
            .select()
            .from(shots)
            .where(eq(shots.id, job.shotId))
            .limit(1),
          database
            .select()
            .from(tracks)
            .where(eq(tracks.id, job.trackId))
            .limit(1)
        ]);
        let request: StoredRequest;
        let requestError: string | null = null;
        try {
          request = readRenderRequest(job.requestJson);
        } catch (error) {
          requestError = error instanceof Error ? error.message : String(error);
          reportLibraryIssue({
            id: `render:${job.id}`,
            kind: "asset",
            projectId: job.projectId,
            assetId: job.assetId,
            message: requestError
          });
          request = {
            projectId: job.projectId,
            shotId: job.shotId,
            sourceAssetId: "",
            frame: 0,
            name: "Unreadable render",
            model: "qwen",
            settings: {},
            referenceImageIds: []
          };
        }
        const frameRange = isStoredVideoOutputRequest(request)
          ? request.frameRange
          : [request.frame, request.frame];
        const liveComfyPrompt = requestError ? null : this.liveComfyPrompt(job);
        const eta = liveComfyPrompt
          ? comfyRenderEta({
              model: job.model,
              livePrompt: liveComfyPrompt,
              now
            })
          : getRenderEta({
              model: job.model,
              status: job.status,
              startedAt: job.startedAt,
              now
            });
        return {
          id: job.id,
          queue_id: job.providerRequestId ?? job.id,
          asset_id: job.assetId,
          clip_id: job.clipId,
          active: !requestError && ACTIVE_STATUSES.includes(job.status),
          status: requestError ? "ERROR" : job.status,
          progress: eta.progress ?? job.progress,
          order: index,
          display_order: unfinishedPositions.get(job.id),
          kind: isStoredVideoOutputRequest(request) ? "video" : "image",
          price: request.estimatedCostUsd ?? 0,
          price_currency: "USD",
          project_id: job.projectId,
          project_name: project?.name ?? "Local project",
          timeline_id: job.shotId,
          timeline_name: shot?.name ?? "Shot",
          layer_id: job.trackId,
          layer_name: track?.name ?? request.name,
          frame_range: frameRange,
          data: {
            ...(isStoredVideoOutputRequest(request)
              ? {}
              : { frame: request.frame }),
            settings: request.settings,
            source_asset:
              request.kind === "image-to-video"
                ? request.startImageAssetId
                : request.sourceAssetId,
            status: job.status
          },
          user_id: "local",
          show_done: true,
          interacted_with: job.interacted,
          isCancelable: !requestError && ACTIVE_STATUSES.includes(job.status),
          created_at: job.createdAt.toISOString(),
          render_started_at: (job.startedAt ?? job.createdAt).toISOString(),
          render_model: job.model,
          ETA: eta.ETA,
          estimated_end_time: eta.estimatedEndTime,
          finished_at: (job.finishedAt ?? job.updatedAt).toISOString(),
          error: requestError
            ? { error_type: "saved_data_error", error_message: requestError }
            : job.error
              ? {
                  error_type:
                    isComfyRenderModel(job.model) &&
                    isComfyOutOfMemoryError(job.error)
                      ? "OutOfMemoryError"
                      : "provider_error",
                  error_message: isComfyRenderModel(job.model)
                    ? job.error
                    : job.error
                }
              : undefined
        };
      })
    );
  }

  async cancel(jobId: string): Promise<void> {
    const database = this.manager.get();
    const [job] = await database
      .select()
      .from(imageRenderJobs)
      .where(eq(imageRenderJobs.id, jobId))
      .limit(1);
    if (!job || !ACTIVE_STATUSES.includes(job.status)) return;
    if (job.providerRequestId) {
      try {
        const request = parseJson<StoredRequest>(job.requestJson);
        if (isComfyRenderModel(job.model)) {
          const storedComfyEndpoint =
            "comfyEndpoint" in request ? request.comfyEndpoint : undefined;
          const endpoint = storedComfyEndpoint
            ? storedComfyEndpoint
            : await this.getComfyEndpoint();
          if (job.model === "wan_animate_2_2")
            await new ComfyWanAnimateClient(endpoint).cancel(
              job.providerRequestId
            );
          else if (job.model === "wan_vace_2_1")
            await new ComfyWanVaceClient(endpoint).cancel(
              job.providerRequestId
            );
          else if (job.model === "mago_style_transfer_local")
            await new ComfyWanFunControlClient(endpoint).cancel(
              job.providerRequestId
            );
          else if (job.model === "mago_animate")
            await new ComfyMagoAnimateClient(endpoint).cancel(
              job.providerRequestId
            );
          else if (job.model === "ltx_2_3_spatial_upscaler")
            await new ComfyLtxUpscaleClient(endpoint).cancel(
              job.providerRequestId
            );
          else if (job.model === "minimax_h3_local")
            await new ComfyMiniMaxH3Client(endpoint).cancel(
              job.providerRequestId
            );
          else
            await new ComfyQwenClient(endpoint).cancel(job.providerRequestId);
        }
      } catch (error) {
        console.warn(
          "Unable to cancel provider request; marking it cancelled locally",
          error
        );
      }
    }
    this.comfyStatusCheckedAtByJobId.delete(job.id);
    await this.finishWithStatus(
      job.id,
      job.assetId,
      job.clipId,
      "CANCELLED",
      "cancelled"
    );
  }

  async markInteracted(jobId: string): Promise<void> {
    await this.manager
      .get()
      .update(imageRenderJobs)
      .set({ interacted: true, updatedAt: new Date() })
      .where(eq(imageRenderJobs.id, jobId));
  }

  async kick(): Promise<void> {
    if (!this.manager.isOpen()) return;
    if (this.processing) {
      this.isKickRequestedDuringProcessing = true;
      return;
    }
    this.processing = true;
    this.isKickRequestedDuringProcessing = false;
    try {
      const jobs = await this.manager
        .get()
        .select()
        .from(imageRenderJobs)
        .where(inArray(imageRenderJobs.status, ACTIVE_STATUSES));
      for (const job of jobs) {
        try {
          await this.process(job);
          clearLibraryIssue(`render-poll:${job.id}`);
        } catch (error) {
          const rawMessage =
            error instanceof Error ? error.message : "Unknown render error";
          const message = rawMessage;
          const permanent =
            error instanceof InvalidRenderDataError ||
            ["ENOENT", "EACCES", "EPERM", "ENOSPC"].includes(
              (error as NodeJS.ErrnoException).code ?? ""
            );
          if (
            isComfyRenderModel(job.model) &&
            job.providerRequestId &&
            !permanent
          ) {
            console.warn("Image render polling will retry", job.id, error);
            reportLibraryIssue({
              id: `render-poll:${job.id}`,
              kind: "service",
              projectId: job.projectId,
              message: `Unable to check render ${job.id}: ${message}. Retrying automatically.`
            });
            continue;
          }
          console.error("Image render failed", job.id, error);
          await this.finishWithStatus(
            job.id,
            job.assetId,
            job.clipId,
            "ERROR",
            "failed",
            message
          );
        }
      }
    } finally {
      this.processing = false;
    }
    if (this.isKickRequestedDuringProcessing) this.scheduleKick();
  }

  private async process(
    job: typeof imageRenderJobs.$inferSelect
  ): Promise<void> {
    readRenderRequest(job.requestJson);
    if (job.model === "qwen") {
      await this.processComfyQwen(job);
      return;
    }
    if (job.model === "wan_animate_2_2") {
      await this.processComfyWanAnimate(job);
      return;
    }
    if (job.model === "wan_vace_2_1") {
      await this.processComfyWanVace(job);
      return;
    }
    if (job.model === "mago_style_transfer_local") {
      await this.processComfyFunControl(job);
      return;
    }
    if (job.model === "mago_animate") {
      await this.processComfyMagoAnimate(job);
      return;
    }
    if (job.model === "ltx_2_3_spatial_upscaler") {
      await this.processComfyLtxUpscale(job);
      return;
    }
    if (job.model === "minimax_h3_local") {
      await this.processComfyMiniMaxH3(job);
      return;
    }
    throw new Error(
      "This saved render used a personal fal.ai key. Submit a new render through Mago Cloud."
    );
  }

  private async processComfyQwen(
    job: typeof imageRenderJobs.$inferSelect
  ): Promise<void> {
    const request = parseJson<StoredImageRequest>(job.requestJson);
    const endpoint = request.comfyEndpoint ?? (await this.getComfyEndpoint());
    const client = new ComfyQwenClient(
      endpoint,
      resolveQwenImageEditSetup(request.settings.qwen_image_edit_setup)
    );
    if (!job.providerRequestId) {
      const imagePaths = [
        await this.resolveInputImagePath(request),
        ...(await Promise.all(
          request.referenceImageIds.slice(0, 2).map((id) => this.assetPath(id))
        ))
      ];
      const basePrompt =
        typeof request.settings.prompt === "string"
          ? request.settings.prompt
          : "";
      const promptId = await client.submit({
        imagePaths,
        prompt:
          imagePaths.length > 1
            ? `${QWEN_MULTI_REFERENCE_INSTRUCTION}\n\n${basePrompt}`
            : basePrompt,
        negativePrompt:
          typeof request.settings.negative_prompt === "string"
            ? request.settings.negative_prompt
            : "",
        seed:
          typeof request.settings.seed === "number"
            ? request.settings.seed
            : undefined
      });
      const now = new Date();
      await this.manager.transaction(async (database) => {
        await database
          .update(imageRenderJobs)
          .set({
            providerRequestId: promptId,
            status: "INQUEUE",
            progress: QUEUED_PROGRESS,
            requestJson: JSON.stringify({
              ...request,
              comfyEndpoint: endpoint
            }),
            startedAt: now,
            updatedAt: now
          })
          .where(eq(imageRenderJobs.id, job.id));
        await database
          .update(assets)
          .set({ status: "INQUEUE", updatedAt: now })
          .where(eq(assets.id, job.assetId));
      });
      return;
    }
    const promptId = job.providerRequestId;
    const result = await this.readComfyJobResult(job, promptId, endpoint, () =>
      client.poll(promptId)
    );
    if (result.state === "finished") {
      await this.completeImageBytes(job, result.bytes, "ComfyUI");
      return;
    }
    if (result.state === "error") {
      await this.finishWithStatus(
        job.id,
        job.assetId,
        job.clipId,
        "ERROR",
        "failed",
        result.message
      );
      return;
    }
    await this.updateProviderProgress(job, result);
  }

  private async processComfyWanAnimate(
    job: typeof imageRenderJobs.$inferSelect
  ): Promise<void> {
    const request = parseJson<StoredVideoRequest>(job.requestJson);
    const endpoint = request.comfyEndpoint ?? (await this.getComfyEndpoint());
    const client = new ComfyWanAnimateClient(endpoint);
    const { width, height } = this.resolveWanDimensions(
      request.settings,
      request.inputCrop
    );
    if (!job.providerRequestId) {
      const root = await this.requireLibraryRoot();
      const inputPath = path.join(root, request.inputRelativePath);
      try {
        const inputStats = await stat(inputPath);
        if (!inputStats.isFile())
          throw new Error("Prepared video is unavailable");
      } catch {
        await this.trimVideo(
          request.sourcePath,
          inputPath,
          request.sourceStartSeconds,
          request.sourceEndSeconds,
          request.fps,
          undefined,
          { width, height },
          request.inputCrop
        );
      }
      const mode: WanAnimateMode =
        request.settings.wan_mode === "move" ? "move" : "mix";
      const promptId = await client.submit({
        videoPath: inputPath,
        referenceImagePath: await this.assetPath(request.referenceImageIds[0]),
        prompt:
          typeof request.settings.prompt === "string"
            ? request.settings.prompt
            : "",
        mode,
        frameCount: this.wanAnimateFrameCount(request.frameRange),
        width,
        height,
        seed:
          typeof request.settings.seed === "number"
            ? request.settings.seed
            : undefined
      });
      const now = new Date();
      await this.manager.transaction(async (database) => {
        await database
          .update(imageRenderJobs)
          .set({
            providerRequestId: promptId,
            status: "INQUEUE",
            progress: QUEUED_PROGRESS,
            requestJson: JSON.stringify({
              ...request,
              comfyEndpoint: endpoint
            }),
            startedAt: now,
            updatedAt: now
          })
          .where(eq(imageRenderJobs.id, job.id));
        await database
          .update(assets)
          .set({ status: "INQUEUE", updatedAt: now })
          .where(eq(assets.id, job.assetId));
      });
      return;
    }
    const promptId = job.providerRequestId;
    const result = await this.readComfyJobResult(
      job,
      promptId,
      endpoint,
      async () =>
        client.poll(
          promptId,
          path.join(
            await this.ensureVideoRenderDirectory(job),
            "comfy-output.mp4"
          )
        )
    );
    if (result.state === "finished") {
      await this.completeComfyVideo(job, request, result.videoPath, {
        width,
        height
      });
      return;
    }
    if (result.state === "error") {
      await this.finishWithStatus(
        job.id,
        job.assetId,
        job.clipId,
        "ERROR",
        "failed",
        result.message
      );
      return;
    }
    await this.updateProviderProgress(job, result);
  }

  private async processComfyWanVace(
    job: typeof imageRenderJobs.$inferSelect
  ): Promise<void> {
    const request = parseJson<StoredVideoRequest>(job.requestJson);
    const endpoint = request.comfyEndpoint ?? (await this.getComfyEndpoint());
    const client = new ComfyWanVaceClient(endpoint);
    const { width, height } = this.resolveWanDimensions(
      request.settings,
      request.inputCrop
    );
    if (!job.providerRequestId) {
      const root = await this.requireLibraryRoot();
      const inputPath = path.join(root, request.inputRelativePath);
      try {
        const inputStats = await stat(inputPath);
        if (!inputStats.isFile()) throw new Error("Prepared video unavailable");
      } catch {
        await this.trimVideo(
          request.sourcePath,
          inputPath,
          request.sourceStartSeconds,
          request.sourceEndSeconds,
          request.fps,
          undefined,
          { width, height },
          request.inputCrop
        );
      }
      const promptId = await client.submitVace({
        videoPath: inputPath,
        referenceImagePath: await this.assetPath(request.referenceImageIds[0]),
        prompt:
          typeof request.settings.prompt === "string"
            ? request.settings.prompt
            : "",
        frameCount: this.wanVaceFrameCount(request.frameRange),
        variant: (request.settings.vace_model_size === "1.3b_fp16"
          ? "1.3b_fp16"
          : "14b_fp8") satisfies WanVaceVariant,
        width,
        height,
        depthStrength: readBoundedSetting(
          request.settings.vace_depth_strength,
          VACE_SETTING_BOUNDS.depthStrength
        ),
        poseStrength: readBoundedSetting(
          request.settings.vace_pose_strength,
          VACE_SETTING_BOUNDS.poseStrength
        ),
        seed:
          typeof request.settings.seed === "number"
            ? request.settings.seed
            : undefined
      });
      const now = new Date();
      await this.manager.transaction(async (database) => {
        await database
          .update(imageRenderJobs)
          .set({
            providerRequestId: promptId,
            status: "INQUEUE",
            progress: QUEUED_PROGRESS,
            requestJson: JSON.stringify({
              ...request,
              comfyEndpoint: endpoint
            }),
            startedAt: now,
            updatedAt: now
          })
          .where(eq(imageRenderJobs.id, job.id));
        await database
          .update(assets)
          .set({ status: "INQUEUE", updatedAt: now })
          .where(eq(assets.id, job.assetId));
      });
      return;
    }
    const promptId = job.providerRequestId;
    const result = await this.readComfyJobResult(
      job,
      promptId,
      endpoint,
      async () =>
        client.poll(
          promptId,
          path.join(
            await this.ensureVideoRenderDirectory(job),
            "comfy-output.mp4"
          )
        )
    );
    if (result.state === "finished") {
      await this.completeComfyVideo(job, request, result.videoPath, {
        width,
        height
      });
      return;
    }
    if (result.state === "error") {
      await this.finishWithStatus(
        job.id,
        job.assetId,
        job.clipId,
        "ERROR",
        "failed",
        result.message
      );
      return;
    }
    await this.updateProviderProgress(job, result);
  }

  private async processComfyFunControl(
    job: typeof imageRenderJobs.$inferSelect
  ): Promise<void> {
    const request = parseJson<StoredVideoRequest>(job.requestJson);
    const endpoint = request.comfyEndpoint ?? (await this.getComfyEndpoint());
    const client = new ComfyWanFunControlClient(endpoint);
    const { width, height } = this.resolveWanDimensions(
      request.settings,
      request.inputCrop
    );
    if (!job.providerRequestId) {
      const root = await this.requireLibraryRoot();
      const inputPath = path.join(root, request.inputRelativePath);
      try {
        const inputStats = await stat(inputPath);
        if (!inputStats.isFile())
          throw new Error("Prepared video is unavailable");
      } catch {
        await this.trimVideo(
          request.sourcePath,
          inputPath,
          request.sourceStartSeconds,
          request.sourceEndSeconds,
          request.fps,
          readRawVideoControlStrength(request.settings),
          { width, height },
          request.inputCrop
        );
      }
      const quantisation = isWanFunQuantisation(request.settings.fun_model_size)
        ? request.settings.fun_model_size
        : "fp8_scaled";
      const promptId = await client.submitFunControl({
        videoPath: inputPath,
        startImagePath: await this.assetPath(request.referenceImageIds[0]),
        prompt:
          typeof request.settings.prompt === "string"
            ? request.settings.prompt
            : "",
        negativePrompt:
          typeof request.settings.negative_prompt === "string"
            ? request.settings.negative_prompt
            : "",
        frameCount: this.wanVaceFrameCount(request.frameRange),
        quantisation,
        width,
        height,
        steps: readBoundedSetting(
          request.settings.steps,
          FUN_CONTROL_SETTING_BOUNDS.steps
        ),
        splitPercentage: readBoundedSetting(
          request.settings.split_step_percentage,
          FUN_CONTROL_SETTING_BOUNDS.splitPercentage
        ),
        cfg: readBoundedSetting(
          request.settings.cfg,
          FUN_CONTROL_SETTING_BOUNDS.cfg
        ),
        shift: readBoundedSetting(
          request.settings.shift,
          FUN_CONTROL_SETTING_BOUNDS.shift
        ),
        speedupLoraStrength: readBoundedSetting(
          request.settings.low_step_accelerator,
          FUN_CONTROL_SETTING_BOUNDS.speedupLoraStrength
        ),
        colorMatchStrength: readBoundedSetting(
          request.settings.color_match_strength,
          FUN_CONTROL_SETTING_BOUNDS.colorMatchStrength
        ),
        seed:
          typeof request.settings.seed === "number"
            ? request.settings.seed
            : undefined
      });
      const now = new Date();
      await this.manager.transaction(async (database) => {
        await database
          .update(imageRenderJobs)
          .set({
            providerRequestId: promptId,
            status: "INQUEUE",
            progress: QUEUED_PROGRESS,
            requestJson: JSON.stringify({
              ...request,
              comfyEndpoint: endpoint
            }),
            startedAt: now,
            updatedAt: now
          })
          .where(eq(imageRenderJobs.id, job.id));
        await database
          .update(assets)
          .set({ status: "INQUEUE", updatedAt: now })
          .where(eq(assets.id, job.assetId));
      });
      return;
    }
    const promptId = job.providerRequestId;
    const result = await this.readComfyJobResult(
      job,
      promptId,
      endpoint,
      async () =>
        client.poll(
          promptId,
          path.join(
            await this.ensureVideoRenderDirectory(job),
            "comfy-output.mp4"
          )
        )
    );
    if (result.state === "finished") {
      await this.completeComfyVideo(job, request, result.videoPath, {
        width,
        height
      });
      return;
    }
    if (result.state === "error") {
      await this.finishWithStatus(
        job.id,
        job.assetId,
        job.clipId,
        "ERROR",
        "failed",
        result.message
      );
      return;
    }
    await this.updateProviderProgress(job, result);
  }

  private async processComfyMagoAnimate(
    job: typeof imageRenderJobs.$inferSelect
  ): Promise<void> {
    const request = parseJson<StoredVideoRequest>(job.requestJson);
    const endpoint = request.comfyEndpoint ?? (await this.getComfyEndpoint());
    const client = new ComfyMagoAnimateClient(endpoint);
    const { width, height } = this.resolveWanDimensions(
      request.settings,
      request.inputCrop
    );
    if (!job.providerRequestId) {
      const root = await this.requireLibraryRoot();
      const inputPath = path.join(root, request.inputRelativePath);
      try {
        const inputStats = await stat(inputPath);
        if (!inputStats.isFile())
          throw new Error("Prepared video is unavailable");
      } catch {
        await this.trimVideo(
          request.sourcePath,
          inputPath,
          request.sourceStartSeconds,
          request.sourceEndSeconds,
          request.fps,
          undefined,
          { width, height },
          request.inputCrop
        );
      }
      const quantisation = isMagoAnimateQuantisation(
        request.settings.animate_model_size
      )
        ? request.settings.animate_model_size
        : "Q4_K_M";
      const promptId = await client.submitMagoAnimate({
        videoPath: inputPath,
        referenceImagePath: await this.assetPath(request.referenceImageIds[0]),
        prompt: readStringSetting(request.settings.prompt),
        posePrompt: readStringSetting(request.settings.pose_prompt),
        negativePrompt: readStringSetting(request.settings.negative_prompt),
        frameCount: this.wanVaceFrameCount(request.frameRange),
        quantisation,
        width,
        height,
        steps: readBoundedSetting(
          request.settings.steps,
          MAGO_ANIMATE_SETTING_BOUNDS.steps
        ),
        cfg: readBoundedSetting(
          request.settings.cfg,
          MAGO_ANIMATE_SETTING_BOUNDS.cfg
        ),
        shift: readBoundedSetting(
          request.settings.shift,
          MAGO_ANIMATE_SETTING_BOUNDS.shift
        ),
        referenceImageStrength: readBoundedSetting(
          request.settings.reference_image_strength,
          MAGO_ANIMATE_SETTING_BOUNDS.referenceImageStrength
        ),
        poseStrength: readBoundedSetting(
          request.settings.pose_strength,
          MAGO_ANIMATE_SETTING_BOUNDS.poseStrength
        ),
        poseStartPercent: readBoundedSetting(
          request.settings.pose_start_percent,
          MAGO_ANIMATE_SETTING_BOUNDS.poseStartPercent
        ),
        poseEndPercent: readBoundedSetting(
          request.settings.pose_end_percent,
          MAGO_ANIMATE_SETTING_BOUNDS.poseEndPercent
        ),
        cacheDevice:
          request.settings.animate_cache_device === "cpu" ? "cpu" : "gpu",
        cacheDtype: readAnimateCacheDtype(request.settings),
        trimDuplicatedFrame: request.settings.trim_duplicated_frame === true,
        seed:
          typeof request.settings.seed === "number"
            ? request.settings.seed
            : undefined
      });
      const now = new Date();
      await this.manager.transaction(async (database) => {
        await database
          .update(imageRenderJobs)
          .set({
            providerRequestId: promptId,
            status: "INQUEUE",
            progress: QUEUED_PROGRESS,
            requestJson: JSON.stringify({
              ...request,
              comfyEndpoint: endpoint
            }),
            startedAt: now,
            updatedAt: now
          })
          .where(eq(imageRenderJobs.id, job.id));
        await database
          .update(assets)
          .set({ status: "INQUEUE", updatedAt: now })
          .where(eq(assets.id, job.assetId));
      });
      return;
    }
    const promptId = job.providerRequestId;
    const result = await this.readComfyJobResult(
      job,
      promptId,
      endpoint,
      async () =>
        client.poll(
          promptId,
          path.join(
            await this.ensureVideoRenderDirectory(job),
            "comfy-output.mp4"
          )
        )
    );
    if (result.state === "finished") {
      await this.completeComfyVideo(job, request, result.videoPath, {
        width,
        height
      });
      return;
    }
    if (result.state === "error") {
      await this.finishWithStatus(
        job.id,
        job.assetId,
        job.clipId,
        "ERROR",
        "failed",
        result.message
      );
      return;
    }
    await this.updateProviderProgress(job, result);
  }

  private async processComfyLtxUpscale(
    job: typeof imageRenderJobs.$inferSelect
  ): Promise<void> {
    const request = parseJson<StoredVideoRequest>(job.requestJson);
    const endpoint = request.comfyEndpoint ?? (await this.getComfyEndpoint());
    const client = new ComfyLtxUpscaleClient(endpoint);
    const factor: LtxUpscaleFactor =
      Number(request.settings.ltx_upscale_factor) === LTX_UPSCALE_FACTOR_4
        ? LTX_UPSCALE_FACTOR_4
        : LTX_UPSCALE_FACTOR_2;
    const width = readBoundedNumber(
      request.settings.width,
      LTX_DEFAULT_INPUT_DIMENSION,
      LTX_MIN_INPUT_DIMENSION,
      LTX_MAX_INPUT_DIMENSION
    );
    const height = readBoundedNumber(
      request.settings.height,
      LTX_DEFAULT_INPUT_DIMENSION,
      LTX_MIN_INPUT_DIMENSION,
      LTX_MAX_INPUT_DIMENSION
    );
    if (!job.providerRequestId) {
      const root = await this.requireLibraryRoot();
      const inputPath = path.join(root, request.inputRelativePath);
      try {
        const inputStats = await stat(inputPath);
        if (!inputStats.isFile())
          throw new Error("Prepared video is unavailable");
      } catch {
        await this.trimVideo(
          request.sourcePath,
          inputPath,
          request.sourceStartSeconds,
          request.sourceEndSeconds,
          request.fps,
          undefined,
          { width, height },
          request.inputCrop,
          LTX_TRIM_ALIGNMENT * factor
        );
      }
      const promptId = await client.submitLtxUpscale({
        videoPath: inputPath,
        prompt: readStringSetting(request.settings.prompt),
        negativePrompt: readStringSetting(request.settings.negative_prompt),
        width,
        height,
        factor,
        loraStrength: readBoundedNumber(
          request.settings.ltx_upscale_lora_strength,
          1,
          0,
          LTX_MAX_LORA_STRENGTH
        ),
        tileSize: readBoundedNumber(
          request.settings.tile_base_size,
          DEFAULT_LTX_TILE_SIZE,
          MIN_LTX_TILE_SIZE,
          MAX_LTX_TILE_SIZE
        ),
        seed:
          typeof request.settings.seed === "number"
            ? request.settings.seed
            : undefined
      });
      const now = new Date();
      await this.manager.transaction(async (database) => {
        await database
          .update(imageRenderJobs)
          .set({
            providerRequestId: promptId,
            status: "INQUEUE",
            progress: QUEUED_PROGRESS,
            requestJson: JSON.stringify({
              ...request,
              comfyEndpoint: endpoint
            }),
            startedAt: now,
            updatedAt: now
          })
          .where(eq(imageRenderJobs.id, job.id));
        await database
          .update(assets)
          .set({ status: "INQUEUE", updatedAt: now })
          .where(eq(assets.id, job.assetId));
      });
      return;
    }
    const promptId = job.providerRequestId;
    const result = await this.readComfyJobResult(
      job,
      promptId,
      endpoint,
      async () =>
        client.poll(
          promptId,
          path.join(
            await this.ensureVideoRenderDirectory(job),
            "comfy-output.mp4"
          )
        )
    );
    if (result.state === "finished") {
      await this.completeComfyVideo(job, request, result.videoPath, {
        width,
        height
      });
      return;
    }
    if (result.state === "error") {
      await this.finishWithStatus(
        job.id,
        job.assetId,
        job.clipId,
        "ERROR",
        "failed",
        result.message
      );
      return;
    }
    await this.updateProviderProgress(job, result);
  }

  private liveComfyPrompt(
    job: typeof imageRenderJobs.$inferSelect
  ): ComfyLivePrompt | null {
    if (!isComfyRenderModel(job.model) || !job.providerRequestId) return null;
    const { comfyEndpoint } = parseJson<{ comfyEndpoint?: string }>(
      job.requestJson
    );
    if (!comfyEndpoint) return null;
    return comfyProgressMonitorFor(comfyEndpoint).livePrompt(
      job.providerRequestId
    );
  }

  private async processComfyMiniMaxH3(
    job: typeof imageRenderJobs.$inferSelect
  ): Promise<void> {
    const request = parseJson<StoredVideoRequest>(job.requestJson);
    const endpoint = request.comfyEndpoint ?? (await this.getComfyEndpoint());
    const client = new ComfyMiniMaxH3Client(endpoint);
    if (!job.providerRequestId) {
      const root = await this.requireLibraryRoot();
      const inputPath = path.join(root, request.inputRelativePath);
      try {
        const inputStats = await stat(inputPath);
        if (!inputStats.isFile())
          throw new Error("Prepared video is unavailable");
      } catch {
        await this.trimVideo(
          request.sourcePath,
          inputPath,
          request.sourceStartSeconds,
          request.sourceEndSeconds,
          MINIMAX_H3_FPS
        );
      }
      const referenceImagePaths = await Promise.all(
        request.referenceImageIds.map((assetId) => this.assetPath(assetId))
      );
      const doesSourceVideoHaveAudio =
        await doesVideoHaveAudioStream(inputPath);
      const promptId = await client.submitMiniMaxH3(
        buildMiniMaxH3RenderRequest({
          settings: request.settings,
          durationSeconds:
            request.sourceEndSeconds - request.sourceStartSeconds,
          referenceImagePaths,
          sourceVideoPath: inputPath,
          doesSourceVideoHaveAudio
        })
      );
      const now = new Date();
      await this.manager.transaction(async (database) => {
        await database
          .update(imageRenderJobs)
          .set({
            providerRequestId: promptId,
            status: "INQUEUE",
            progress: QUEUED_PROGRESS,
            requestJson: JSON.stringify({
              ...request,
              comfyEndpoint: endpoint
            }),
            startedAt: now,
            updatedAt: now
          })
          .where(eq(imageRenderJobs.id, job.id));
        await database
          .update(assets)
          .set({ status: "INQUEUE", updatedAt: now })
          .where(eq(assets.id, job.assetId));
      });
      return;
    }
    const promptId = job.providerRequestId;
    const result = await this.readComfyJobResult(
      job,
      promptId,
      endpoint,
      async () =>
        client.poll(
          promptId,
          path.join(
            await this.ensureVideoRenderDirectory(job),
            "comfy-output.mp4"
          )
        )
    );
    if (result.state === "finished") {
      await this.completeVideoFile(job, request, result.videoPath);
      return;
    }
    if (result.state === "error") {
      await this.finishWithStatus(
        job.id,
        job.assetId,
        job.clipId,
        "ERROR",
        "failed",
        result.message
      );
      return;
    }
    await this.updateProviderProgress(job, result);
  }

  private async readComfyJobResult<
    TResult extends
      | { state: "queued" | "running" }
      | { state: "finished" }
      | { state: "error"; message: string }
  >(
    job: typeof imageRenderJobs.$inferSelect,
    promptId: string,
    endpoint: string,
    readOverHttp: () => Promise<TResult>
  ): Promise<TResult | { state: "queued" | "running" }> {
    const { result, statusCheckedAt } = await readComfyPromptWithSafetyPoll({
      monitor: comfyProgressMonitorFor(endpoint),
      promptId,
      lastStatusCheckAt:
        this.comfyStatusCheckedAtByJobId.get(job.id) ??
        Number.NEGATIVE_INFINITY,
      readOverHttp
    });
    const isPromptOver =
      result.state === "finished" || result.state === "error";
    if (isPromptOver) this.comfyStatusCheckedAtByJobId.delete(job.id);
    else if (statusCheckedAt !== null)
      this.comfyStatusCheckedAtByJobId.set(job.id, statusCheckedAt);
    return result;
  }

  private async ensureVideoRenderDirectory(
    job: typeof imageRenderJobs.$inferSelect
  ): Promise<string> {
    const root = await this.requireLibraryRoot();
    const jobDirectory = path.join(root, "renders", "videos", job.id);
    await mkdir(jobDirectory, { recursive: true });
    return jobDirectory;
  }

  private async completeComfyVideo(
    job: typeof imageRenderJobs.$inferSelect,
    request: StoredVideoRequest,
    comfyOutputPath: string,
    { width, height }: { width: number; height: number }
  ): Promise<void> {
    const unpaddedPath = path.join(
      path.dirname(comfyOutputPath),
      "unpadded.mp4"
    );
    try {
      await this.filterVideoFile(
        comfyOutputPath,
        unpaddedPath,
        `crop=${width}:${height}:0:0`,
        "Unable to crop the generated video back to its original size"
      );
    } finally {
      await rm(comfyOutputPath, { force: true });
    }
    await this.completeVideoFile(job, request, unpaddedPath);
  }

  private async updateProviderProgress(
    job: typeof imageRenderJobs.$inferSelect,
    result: Extract<ComfyPollResult, { state: "queued" | "running" }>
  ): Promise<void> {
    const status = result.state === "running" ? "INPROGRESS" : "INQUEUE";
    const liveComfyPrompt = this.liveComfyPrompt(job);
    const progress = liveComfyPrompt
      ? comfyProgressPercent(liveComfyPrompt)
      : status === "INPROGRESS"
        ? RUNNING_PROGRESS
        : QUEUED_PROGRESS;
    const now = new Date();
    await this.manager.transaction(async (database) => {
      await database
        .update(imageRenderJobs)
        .set({ status, progress, updatedAt: now })
        .where(eq(imageRenderJobs.id, job.id));
      await database
        .update(assets)
        .set({ status, updatedAt: now })
        .where(eq(assets.id, job.assetId));
    });
  }

  private async trimVideo(
    sourcePath: string,
    outputPath: string,
    start: number,
    end: number,
    targetFps?: number,
    motionStrength?: number,
    wanDimensions?: { width: number; height: number },
    inputCrop?: CropRect,
    pixelAlignment?: number
  ): Promise<void> {
    if (!ffmpegPath)
      throw new Error("The bundled video encoder is unavailable");
    const executable = ffmpegPath.replace("app.asar", "app.asar.unpacked");
    const duration = Math.max(MIN_TRIM_DURATION_SECONDS, end - start);
    const videoFilter = wanDimensions
      ? buildWanPreparedVideoFilter(
          targetFps,
          wanDimensions.width,
          wanDimensions.height,
          motionStrength,
          inputCrop,
          pixelAlignment
        )
      : buildPreparedVideoFilter(targetFps, inputCrop);
    const args = [
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      String(start),
      "-i",
      sourcePath,
      "-t",
      String(duration),
      "-map",
      "0:v:0",
      "-map",
      "0:a?",
      "-vf",
      videoFilter,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      "-y",
      outputPath
    ];
    await new Promise<void>((resolve, reject) => {
      const child = spawn(executable, args, {
        windowsHide: true,
        stdio: ["ignore", "ignore", "pipe"]
      });
      let errorOutput = "";
      child.stderr.on("data", (chunk: Buffer) => {
        errorOutput = `${errorOutput}${chunk.toString()}`.slice(
          -MAX_FFMPEG_ERROR_LENGTH
        );
      });
      child.once("error", reject);
      child.once("exit", (code) => {
        if (code === 0) resolve();
        else
          reject(
            new Error(
              `Unable to prepare the selected video for Seedance${
                errorOutput.trim() ? `: ${errorOutput.trim()}` : ""
              }`
            )
          );
      });
    });
  }

  private async filterVideoFile(
    inputPath: string,
    outputPath: string,
    videoFilter: string,
    errorMessage: string
  ): Promise<void> {
    if (!ffmpegPath)
      throw new Error("The bundled video encoder is unavailable");
    const executable = ffmpegPath.replace("app.asar", "app.asar.unpacked");
    const args = [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      inputPath,
      "-vf",
      videoFilter,
      "-c:v",
      "libx264",
      "-crf",
      String(LOCAL_VIDEO_RENDER_CRF),
      "-c:a",
      "copy",
      "-movflags",
      "+faststart",
      "-y",
      outputPath
    ];
    try {
      await new Promise<void>((resolve, reject) => {
        const child = spawn(executable, args, {
          windowsHide: true,
          stdio: ["ignore", "ignore", "pipe"]
        });
        let errorOutput = "";
        child.stderr.on("data", (chunk: Buffer) => {
          errorOutput = `${errorOutput}${chunk.toString()}`.slice(
            -MAX_FFMPEG_ERROR_LENGTH
          );
        });
        child.once("error", reject);
        child.once("exit", (code) => {
          if (code === 0) resolve();
          else
            reject(
              new Error(
                `${errorMessage}${
                  errorOutput.trim() ? `: ${errorOutput.trim()}` : ""
                }`
              )
            );
        });
      });
    } catch (error) {
      await rm(outputPath, { force: true });
      throw error;
    }
  }

  private async completeImageBytes(
    job: typeof imageRenderJobs.$inferSelect,
    bytes: Buffer,
    providerName: string
  ): Promise<void> {
    const image = nativeImage.createFromBuffer(bytes);
    if (image.isEmpty())
      throw new InvalidRenderDataError(
        `${providerName} returned an invalid image`
      );
    const root = await this.requireLibraryRoot();
    const size = image.getSize();
    const outputRelative = path.join("renders", "images", job.id, "output.png");
    const thumbnailRelative = path.join(
      "thumbnails",
      "assets",
      `${job.assetId}.jpg`
    );
    await Promise.all([
      atomicWriteFile(path.join(root, outputRelative), image.toPNG()),
      atomicWriteFile(
        path.join(root, thumbnailRelative),
        image
          .resize({ width: 480, quality: "good" })
          .toJPEG(THUMBNAIL_JPEG_QUALITY)
      )
    ]);
    const now = new Date();
    await this.manager.transaction(async (database) => {
      await database
        .update(imageRenderJobs)
        .set({
          status: "FINISHED",
          progress: 100,
          finishedAt: now,
          updatedAt: now
        })
        .where(eq(imageRenderJobs.id, job.id));
      await database
        .update(assets)
        .set({
          sourcePath: path.join(root, outputRelative),
          thumbnailRelativePath: thumbnailRelative,
          width: size.width,
          height: size.height,
          sizeBytes: bytes.length,
          status: "available",
          dataJson: JSON.stringify({ queue_status: "FINISHED" }),
          updatedAt: now
        })
        .where(eq(assets.id, job.assetId));
      const [clip] = await database
        .select()
        .from(clips)
        .where(eq(clips.id, job.clipId))
        .limit(1);
      const data = clip
        ? parseJson<Record<string, unknown>>(clip.dataJson)
        : {};
      await database
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
    });
    this.onImageAvailable?.(job.assetId);
  }

  private async completeVideoFile(
    job: typeof imageRenderJobs.$inferSelect,
    request: CompletableVideoRequest,
    renderedVideoPath: string,
    result: Record<string, unknown> = {}
  ): Promise<void> {
    const root = await this.requireLibraryRoot();
    const outputRelative = path.join("renders", "videos", job.id, "output.mp4");
    const outputPath = path.join(root, outputRelative);
    const cropBackVideoFilter = request.cropBack
      ? cropBackFilter(request.cropBack)
      : null;
    if (cropBackVideoFilter) {
      try {
        await atomicProduceFile(outputPath, (temporary) =>
          this.filterVideoFile(
            renderedVideoPath,
            temporary,
            cropBackVideoFilter,
            "Unable to crop the generated video back to the selected crop area"
          )
        );
      } finally {
        await rm(renderedVideoPath, { force: true });
      }
    } else {
      await publishFile(renderedVideoPath, outputPath);
    }
    const deliveredSizeBytes = (await stat(outputPath)).size;

    let thumbnailRelative: string | null = path.join(
      "thumbnails",
      "assets",
      `${job.assetId}.jpg`
    );
    try {
      await atomicProduceFile(path.join(root, thumbnailRelative), (temporary) =>
        this.extractVideoThumbnail(path.join(root, outputRelative), temporary)
      );
    } catch (error) {
      console.warn("Unable to extract generated video thumbnail", error);
      thumbnailRelative = null;
      if (request.sourceThumbnailRelativePath) {
        const extension =
          path.extname(request.sourceThumbnailRelativePath) || ".jpg";
        thumbnailRelative = path.join(
          "thumbnails",
          "assets",
          `${job.assetId}${extension}`
        );
        await atomicCopyFile(
          path.join(root, request.sourceThumbnailRelativePath),
          path.join(root, thumbnailRelative)
        );
      }
    }

    const now = new Date();
    await this.manager.transaction(async (database) => {
      await database
        .update(imageRenderJobs)
        .set({
          status: "FINISHED",
          progress: 100,
          finishedAt: now,
          updatedAt: now
        })
        .where(eq(imageRenderJobs.id, job.id));
      await database
        .update(assets)
        .set({
          sourcePath: path.join(root, outputRelative),
          thumbnailRelativePath: thumbnailRelative,
          sizeBytes: deliveredSizeBytes,
          status: "available",
          dataJson: JSON.stringify({
            queue_status: "FINISHED",
            seed: typeof result.seed === "number" ? result.seed : undefined,
            data: { render_settings: { magov2: request.settings } }
          }),
          updatedAt: now
        })
        .where(eq(assets.id, job.assetId));
      const [clip] = await database
        .select()
        .from(clips)
        .where(eq(clips.id, job.clipId))
        .limit(1);
      const data = clip
        ? parseJson<Record<string, unknown>>(clip.dataJson)
        : {};
      await database
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
    });
  }

  private async extractVideoThumbnail(
    inputPath: string,
    outputPath: string
  ): Promise<void> {
    if (!ffmpegPath)
      throw new Error("The bundled video encoder is unavailable");
    const executable = ffmpegPath.replace("app.asar", "app.asar.unpacked");
    const args = buildVideoThumbnailArgs(inputPath, outputPath);
    await new Promise<void>((resolve, reject) => {
      const child = spawn(executable, args, {
        windowsHide: true,
        stdio: ["ignore", "ignore", "pipe"]
      });
      let errorOutput = "";
      child.stderr.on("data", (chunk: Buffer) => {
        errorOutput = `${errorOutput}${chunk.toString()}`.slice(
          -MAX_FFMPEG_ERROR_LENGTH
        );
      });
      child.once("error", reject);
      child.once("exit", (code) => {
        if (code === 0) resolve();
        else
          reject(
            new Error(
              `Unable to extract first video frame${
                errorOutput.trim() ? `: ${errorOutput.trim()}` : ""
              }`
            )
          );
      });
    });
  }

  private async finishWithStatus(
    jobId: string,
    assetId: string,
    clipId: string,
    status: string,
    clipStatus: string,
    error?: string
  ): Promise<void> {
    const now = new Date();
    await this.manager.transaction(async (database) => {
      await database
        .update(imageRenderJobs)
        .set({
          status,
          progress: 100,
          error: error ?? null,
          finishedAt: now,
          updatedAt: now
        })
        .where(eq(imageRenderJobs.id, jobId));
      await database
        .update(assets)
        .set({ status, updatedAt: now })
        .where(eq(assets.id, assetId));
      const [clip] = await database
        .select()
        .from(clips)
        .where(eq(clips.id, clipId))
        .limit(1);
      let data: Record<string, unknown> = {};
      if (clip) {
        try {
          data = parseJson<Record<string, unknown>>(clip.dataJson);
        } catch {
          reportLibraryIssue({
            id: `clip:${clip.id}`,
            kind: "asset",
            assetId,
            message: `Saved clip ${clip.id} is damaged. Original data has been kept.`
          });
          return;
        }
      }
      await database
        .update(clips)
        .set({
          dataJson: JSON.stringify({ ...data, status: clipStatus, error }),
          updatedAt: now
        })
        .where(eq(clips.id, clipId));
    });
  }

  private async resolveInputImagePath(
    request: StoredImageRequest
  ): Promise<string> {
    if (request.inputRelativePath)
      return path.join(
        await this.requireLibraryRoot(),
        request.inputRelativePath
      );
    if (request.inputImageId) return this.assetPath(request.inputImageId);
    throw new Error("No input image is available");
  }

  private async assetPath(assetId: string): Promise<string> {
    const [asset] = await this.manager
      .get()
      .select()
      .from(assets)
      .where(eq(assets.id, assetId))
      .limit(1);
    if (!asset) throw new Error("A referenced image no longer exists");
    const fileStats = await stat(asset.sourcePath);
    if (!fileStats.isFile() || fileStats.size > MAX_IMAGE_BYTES)
      throw new Error("A referenced image is unavailable or too large");
    return asset.sourcePath;
  }

  private async fileDataUrl(filename: string): Promise<string> {
    const fileStats = await stat(filename);
    if (!fileStats.isFile() || fileStats.size > MAX_IMAGE_BYTES)
      throw new Error("Input image is unavailable or too large");
    const extension = path.extname(filename).toLowerCase();
    const mime =
      extension === ".png"
        ? "image/png"
        : extension === ".webp"
          ? "image/webp"
          : "image/jpeg";
    return `data:${mime};base64,${(await readFile(filename)).toString("base64")}`;
  }

  private decodeDataImage(dataUrl: string): {
    bytes: Buffer;
    extension: "png" | "jpg" | "webp";
  } {
    const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(
      dataUrl
    );
    if (!match) throw new Error("Invalid input image data");
    const bytes = Buffer.from(match[2], "base64");
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES)
      throw new Error("Input image is unavailable or too large");
    return {
      bytes,
      extension: match[1] === "jpeg" ? "jpg" : (match[1] as "png" | "webp")
    };
  }

  private async requireLibraryRoot(): Promise<string> {
    const root = await this.getLibraryRoot();
    if (!root) throw new Error("Choose a Mago library folder first");
    return root;
  }

  private wanAnimateFrameCount(frameRange: [number, number]): number {
    const frames = Math.max(
      WAN_ANIMATE_MIN_FRAMES,
      frameRange[1] - frameRange[0] + 1
    );
    return Math.max(
      WAN_ANIMATE_MIN_FRAMES,
      Math.floor((frames - 1) / WAN_ANIMATE_FRAME_STRIDE) *
        WAN_ANIMATE_FRAME_STRIDE +
        1
    );
  }

  private wanVaceFrameCount(frameRange: [number, number]): number {
    const frames = Math.max(
      WAN_VACE_MIN_FRAMES,
      frameRange[1] - frameRange[0] + 1
    );
    return Math.max(
      WAN_VACE_MIN_FRAMES,
      Math.floor((frames - 1) / WAN_ANIMATE_FRAME_STRIDE) *
        WAN_ANIMATE_FRAME_STRIDE +
        1
    );
  }

  private resolveWanDimensions(
    settings: Record<string, unknown>,
    inputCrop?: CropRect
  ): {
    width: number;
    height: number;
  } {
    if (inputCrop) {
      const maxSize = settings.max_size;
      return fitWanDimensions(
        inputCrop.w,
        inputCrop.h,
        typeof maxSize === "number" ? maxSize : undefined
      );
    }
    const { width, height } = settings;
    if (
      typeof width === "number" &&
      Number.isFinite(width) &&
      width > 0 &&
      typeof height === "number" &&
      Number.isFinite(height) &&
      height > 0
    ) {
      return { width, height };
    }
    return { width: WAN_FALLBACK_SIZE, height: WAN_FALLBACK_SIZE };
  }
}
