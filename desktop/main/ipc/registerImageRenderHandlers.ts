import { ipcMain } from "electron";

import {
  IPC_CHANNELS,
  LOCAL_IMAGE_MODEL_NAMES,
  LOCAL_VIDEO_MODEL_NAMES,
  type LocalImageModelName,
  type LocalImageRenderInput,
  type LocalVideoModelName,
  type LocalVideoRenderInput
} from "../../shared/contracts";
import { CloudRenderJobRepository } from "../cloud/cloudRenderJobRepository";
import { MINIMAX_H3_MAX_REFERENCE_IMAGES } from "../imageRenders/comfyMiniMaxH3Client";
import { isComfyRenderModel } from "../imageRenders/comfyModelValidation";
import { ImageRenderService } from "../imageRenders/imageRenderService";

import { requireTrustedSender } from "./trustedSender";

const isLocalImageModelName = (value: string): value is LocalImageModelName =>
  LOCAL_IMAGE_MODEL_NAMES.some((candidate) => candidate === value);

const isLocalVideoModelName = (value: unknown): value is LocalVideoModelName =>
  LOCAL_VIDEO_MODEL_NAMES.some((candidate) => candidate === value);

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Render input must be an object");
  return value as Record<string, unknown>;
};
const string = (value: unknown, name: string, allowEmpty = false): string => {
  if (typeof value !== "string" || (!allowEmpty && !value.trim()))
    throw new Error(`${name} must be a string`);
  return value;
};

export const registerImageRenderHandlers = (
  service: ImageRenderService,
  cloudRenderJobs: CloudRenderJobRepository
): void => {
  ipcMain.handle(IPC_CHANNELS.imageRendersSubmit, async (event, value) => {
    requireTrustedSender(event);
    const input = record(value);
    const model = string(input.model, "model");
    if (!isLocalImageModelName(model) || !isComfyRenderModel(model))
      throw new Error("Unsupported local image model");
    if (
      !Array.isArray(input.referenceImageIds) ||
      !input.referenceImageIds.every((id) => typeof id === "string")
    )
      throw new Error("referenceImageIds must be an array");
    if (model === "qwen" && input.referenceImageIds.length > 2)
      throw new Error("Qwen Image Edit supports up to two reference images");
    if (
      input.maskImageIds !== undefined &&
      (!Array.isArray(input.maskImageIds) ||
        !input.maskImageIds.every((id) => typeof id === "string"))
    )
      throw new Error("maskImageIds must be an array");
    if (
      typeof input.frame !== "number" ||
      !Number.isInteger(input.frame) ||
      input.frame < 0
    )
      throw new Error("frame must be a non-negative integer");
    return service.submit({
      projectId: string(input.projectId, "projectId"),
      shotId: string(input.shotId, "shotId"),
      sourceAssetId: string(input.sourceAssetId, "sourceAssetId"),
      frame: input.frame,
      name: string(input.name, "name"),
      model,
      inputImage:
        input.inputImage === undefined
          ? undefined
          : string(input.inputImage, "inputImage", true),
      inputImageId:
        input.inputImageId === undefined
          ? undefined
          : string(input.inputImageId, "inputImageId"),
      referenceImageIds: input.referenceImageIds as string[],
      maskImageIds: input.maskImageIds as string[] | undefined,
      estimatedCostUsd:
        typeof input.estimatedCostUsd === "number" &&
        Number.isFinite(input.estimatedCostUsd) &&
        input.estimatedCostUsd >= 0
          ? input.estimatedCostUsd
          : undefined,
      settings: record(input.settings)
    } satisfies LocalImageRenderInput);
  });
  ipcMain.handle(IPC_CHANNELS.imageRendersListQueue, async (event) => {
    requireTrustedSender(event);
    return service.listQueue();
  });
  ipcMain.handle(IPC_CHANNELS.videoRendersSubmit, async (event, value) => {
    requireTrustedSender(event);
    const input = record(value);
    if (!isLocalVideoModelName(input.model) || !isComfyRenderModel(input.model))
      throw new Error("Unsupported local video model");
    const videoModel = input.model;
    if (
      !Array.isArray(input.frameRange) ||
      input.frameRange.length !== 2 ||
      !input.frameRange.every(
        (frame) =>
          typeof frame === "number" && Number.isInteger(frame) && frame >= 0
      ) ||
      input.frameRange[1] < input.frameRange[0]
    ) {
      throw new Error("frameRange must be an increasing pair of frames");
    }
    if (
      typeof input.fps !== "number" ||
      !Number.isFinite(input.fps) ||
      input.fps <= 0
    )
      throw new Error("fps must be positive");
    if (
      !Array.isArray(input.referenceImageIds) ||
      !input.referenceImageIds.every((id) => typeof id === "string")
    )
      throw new Error("referenceImageIds must be an array");
    if (
      (videoModel === "wan_animate_2_2" || videoModel === "wan_vace_2_1") &&
      input.referenceImageIds.length !== 1
    )
      throw new Error("Local Wan video models require one reference image");
    if (
      videoModel === "minimax_h3_local" &&
      input.referenceImageIds.length > MINIMAX_H3_MAX_REFERENCE_IMAGES
    )
      throw new Error(
        `MiniMax H3 accepts up to ${MINIMAX_H3_MAX_REFERENCE_IMAGES} reference images`
      );
    if (
      typeof input.estimatedCostUsd !== "number" ||
      !Number.isFinite(input.estimatedCostUsd) ||
      input.estimatedCostUsd < 0
    )
      throw new Error("estimatedCostUsd must be non-negative");
    return service.submitVideo({
      outputTrackId: string(input.outputTrackId, "outputTrackId"),
      inputTrackId: string(input.inputTrackId, "inputTrackId"),
      frameRange: input.frameRange as [number, number],
      fps: input.fps,
      model: videoModel,
      referenceImageIds: input.referenceImageIds as string[],
      estimatedCostUsd: input.estimatedCostUsd,
      settings: record(input.settings)
    } satisfies LocalVideoRenderInput);
  });
  ipcMain.handle(IPC_CHANNELS.imageRendersCancel, async (event, jobId) => {
    requireTrustedSender(event);
    const renderJobId = string(jobId, "jobId");
    await service.cancel(renderJobId);
    await cloudRenderJobs.cancelActive(renderJobId);
  });
  ipcMain.handle(
    IPC_CHANNELS.imageRendersMarkInteracted,
    async (event, jobId) => {
      requireTrustedSender(event);
      const renderJobId = string(jobId, "jobId");
      await service.markInteracted(renderJobId);
      await cloudRenderJobs.markInteracted(renderJobId);
    }
  );
};
