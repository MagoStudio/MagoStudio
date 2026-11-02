import { backendCloudApi } from "@domains/cloud/backendCloudApi";
import { MirrorProgress } from "@domains/cloud/mirrorService";
import { resolveImageToVideoRenderContext } from "@domains/cloud/resolveImageToVideoRenderContext";
import { resolveRenderContext } from "@domains/cloud/resolveRenderContext";
import { submitCloudImageToVideoRender } from "@domains/cloud/submitCloudImageToVideoRender";
import { submitCloudRender } from "@domains/cloud/submitCloudRender";
import { Layer } from "@schemas/layer";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi, isLocalApp } from "@/platform/localDesktop";
import {
  isImageToVideoLocalVideoModel,
  isLocalVideoModel
} from "@/platform/localVideoModels";
import {
  isVideoModelAvailable,
  videoRenderTarget
} from "@/platform/renderTarget";

import { buildLocalVideoRenderSettings } from "../utils/buildLocalVideoRenderSettings";
import { collectLocalVideoReferenceImageIds } from "../utils/collectLocalVideoReferenceImageIds";
import { isImageToVideoModel } from "../utils/isImageToVideoModel";

import {
  buildRenderPayload,
  BuildRenderPayloadInput
} from "./buildRenderPayload";

export type PostRenderParams = BuildRenderPayloadInput;

/**
 * Reads the track back out of the local library after a submit, so callers get
 * the same shape the cloud endpoint would have returned.
 */
const reloadLocalTrack = async (trackId: string): Promise<Layer> => {
  const projects = await getLocalDesktopApi().projects.listAll();
  for (const project of projects) {
    const timelines = (project.timelines ?? []) as Array<
      Record<string, unknown>
    >;
    for (const timeline of timelines) {
      const layers = (timeline.layers ?? []) as Layer[];
      const layer = layers.find((candidate) => candidate.id === trackId);
      if (layer) return layer;
    }
  }
  throw new Error("The local render track could not be reloaded");
};

export const postRender = async (
  params: PostRenderParams,
  onProgress?: MirrorProgress
): Promise<Layer> => {
  const body = buildRenderPayload(params);
  const settings = body.render_settings.magov2;
  const requestedModel =
    typeof settings.mago_engine === "string" ? settings.mago_engine : undefined;

  if (isLocalApp && !isVideoModelAvailable(requestedModel)) {
    throw new Error(
      "The selected render provider is unavailable. Enable Mago Cloud and sign in, or select an enabled local model."
    );
  }

  // Routing is a property of the model, not of the build: local models run on
  // this machine through the desktop bridge, cloud models go to Mago.
  if (isLocalApp && videoRenderTarget(requestedModel) === "local") {
    const localModel = requestedModel;
    if (!isLocalVideoModel(localModel)) {
      throw new Error("Unsupported Mago Studio video model");
    }
    const frameRange = params.frameRange as [number, number];
    const referenceImageIds = collectLocalVideoReferenceImageIds(
      localModel,
      settings
    );
    const localRenderSettings = buildLocalVideoRenderSettings({
      model: localModel,
      wireSettings: settings,
      panelSettings: params.renderSettings
    });
    const doesLocalModelRenderFromSourceVideo =
      !isImageToVideoLocalVideoModel(localModel);
    const api = getLocalDesktopApi();
    await api.videoRenders.submit({
      outputTrackId: params.parentLayerId,
      ...(doesLocalModelRenderFromSourceVideo
        ? { inputTrackId: params.inputTrackId }
        : {}),
      frameRange,
      fps: params.fps,
      model: localModel,
      referenceImageIds,
      estimatedCostUsd: 0,
      settings: localRenderSettings
    });
    return reloadLocalTrack(params.parentLayerId);
  }

  // A cloud model inside the desktop app: mirror the shot, submit, and record the
  // job locally so the editor shows it straight away.
  if (isLocalApp && isImageToVideoModel(requestedModel)) {
    const projects = await getLocalDesktopApi().projects.listAll();
    const imageToVideoContext = resolveImageToVideoRenderContext(projects, {
      outputTrackId: params.parentLayerId
    });
    if (!imageToVideoContext) {
      throw new Error("This shot could not be prepared for a cloud render");
    }
    await submitCloudImageToVideoRender(backendCloudApi(), {
      payload: body,
      local: imageToVideoContext,
      model: requestedModel ?? "",
      fps: params.fps,
      frameRange: params.frameRange as [number, number],
      onProgress
    });
    return reloadLocalTrack(params.parentLayerId);
  }

  if (isLocalApp) {
    const api = getLocalDesktopApi();
    const projects = await api.projects.listAll();
    const context = resolveRenderContext(projects, {
      outputTrackId: params.parentLayerId,
      inputTrackId: params.inputTrackId
    });
    if (!context) {
      throw new Error("This shot could not be prepared for a cloud render");
    }
    const frameRange = params.frameRange as [number, number];
    await submitCloudRender(backendCloudApi(), {
      payload: body,
      local: context,
      model: requestedModel ?? "",
      fps: params.fps,
      frameRange,
      onProgress
    });
    return reloadLocalTrack(params.parentLayerId);
  }

  const response = await backendApiClient.post(`/assets/add_render`, body);
  return response.data;
};
