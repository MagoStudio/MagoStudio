import { isCloudProject } from "@domains/shot/utils/isCloudProject";

import { getLocalDesktopApi } from "@/platform/localDesktop";

import { createCloudOutputLayer } from "./createCloudOutputLayer";
import { deleteCloudLayer } from "./deleteCloudLayer";
import { findCloudRenderAssetId } from "./findCloudRenderAssetId";
import { mirrorImageToVideoFrameImages } from "./mirrorImageToVideoFrameImages";
import {
  CloudApi,
  ensureCloudImageAsset,
  ensureCloudProject,
  ensureCloudTimeline,
  MirrorProgress
} from "./mirrorService";
import { LocalImageToVideoRenderContext } from "./resolveImageToVideoRenderContext";
import { SubmitCloudRenderInput } from "./submitCloudRender";

export interface SubmitCloudImageToVideoRenderInput {
  payload: SubmitCloudRenderInput["payload"];
  local: LocalImageToVideoRenderContext;
  model: string;
  fps: number;
  frameRange: [number, number];
  onProgress?: MirrorProgress;
}

const readStartImageAssetId = (
  renderSettings: Record<string, unknown>
): string => {
  const startImageAssetId = renderSettings.image_id;
  if (typeof startImageAssetId !== "string" || !startImageAssetId) {
    throw new Error("Image-to-Video renders need a start image");
  }
  return startImageAssetId;
};

const ensureCloudContainerShotOutputLayer = async (
  api: CloudApi,
  input: SubmitCloudImageToVideoRenderInput,
  cloudProjectId: string
): Promise<string> => {
  input.onProgress?.("timeline");
  const cloudTimelineId = await ensureCloudTimeline(api, {
    localShotId: input.local.shotId,
    localProjectId: input.local.projectId,
    cloudProjectId,
    name: input.local.shotName
  });
  return createCloudOutputLayer(api, {
    localOutputTrackId: input.local.outputTrackId,
    shotName: input.local.shotName,
    cloudTimelineId,
    cloudSourceLayerId: null
  });
};

export const submitCloudImageToVideoRender = async (
  api: CloudApi,
  input: SubmitCloudImageToVideoRenderInput,
  removeCloudLayer: (cloudLayerId: string) => Promise<void> = deleteCloudLayer
): Promise<{ jobId: string; cloudAssetId: string }> => {
  const renderSettings = input.payload.render_settings.magov2;
  const startImageAssetId = readStartImageAssetId(renderSettings);

  input.onProgress?.("project");
  const cloudProjectId = await ensureCloudProject(api, {
    localProjectId: input.local.projectId,
    name: input.local.projectName
  });

  const cloudRenderSettings = await mirrorImageToVideoFrameImages(
    renderSettings,
    (localAssetId) =>
      ensureCloudImageAsset(api, localAssetId, cloudProjectId, input.onProgress)
  );

  const isOutputLayerAlreadyInCloud = await isCloudProject(
    input.local.projectId
  );
  const outputLayerId = isOutputLayerAlreadyInCloud
    ? input.local.outputTrackId
    : await ensureCloudContainerShotOutputLayer(api, input, cloudProjectId);
  const removeOutputLayerCreatedHere = isOutputLayerAlreadyInCloud
    ? async () => undefined
    : () => removeCloudLayer(outputLayerId);

  const submitted = await api
    .post<unknown>("/assets/add_render", {
      ...input.payload,
      parent_layer_id: outputLayerId,
      render_settings: {
        ...input.payload.render_settings,
        magov2: cloudRenderSettings
      }
    })
    .catch(async (submitError: unknown) => {
      await removeOutputLayerCreatedHere().catch(() => undefined);
      throw submitError;
    });
  const cloudAssetId = findCloudRenderAssetId(submitted);
  if (!cloudAssetId) {
    throw new Error("Cloud Mago did not return a render output asset");
  }
  input.onProgress?.("done");

  const registered = await getLocalDesktopApi().cloud.renders.register({
    outputTrackId: input.local.outputTrackId,
    sourceAssetId: startImageAssetId,
    model: input.model,
    frameRange: input.frameRange,
    fps: input.fps,
    cloudAssetId,
    cloudOutputLayerId: outputLayerId,
    settings: renderSettings
  });

  return { jobId: registered.jobId, cloudAssetId };
};
