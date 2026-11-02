import { isCloudProject } from "@domains/shot/utils/isCloudProject";

import { getLocalDesktopApi } from "@/platform/localDesktop";

import { alignFrameRangeDerivedSettings } from "./alignFrameRangeDerivedSettings";
import { clampFrameRange } from "./clampFrameRange";
import { createCloudOutputLayer } from "./createCloudOutputLayer";
import { deleteCloudLayer } from "./deleteCloudLayer";
import { findCloudRenderAssetId } from "./findCloudRenderAssetId";
import {
  CloudApi,
  ensureCloudImageAsset,
  ensureMirroredShot,
  MirrorProgress
} from "./mirrorService";
import { mirrorSourceImages, SourcesPayload } from "./mirrorSources";

/**
 * Submits a render to cloud Mago and records it locally.
 *
 * Order matters: mirror the shot and its reference images, create an empty
 * output layer, submit, then create the local rows. A failed submit deletes the
 * output layer again so the cloud timeline keeps no empty orphan. The local rows come last because they carry the cloud
 * ids, and they are what makes the job appear in the editor.
 *
 * Two details here were learned the hard way against staging:
 *
 * - The output layer must be `type: "RENDER"`. An unrecognised type is accepted
 *   with a 201 and silently coerced to IMAGE, which renders wrongly in the cloud
 *   web app with no error to notice.
 * - `add_render` rejects a parent layer that already holds a clip, so the output
 *   layer has to be created fresh for every render.
 */

export interface SubmitCloudRenderInput {
  /** The `add_render` body from the shared buildRenderPayload. */
  payload: {
    parent_layer_id: string;
    frame_range: number[];
    render_mode: string;
    render_settings: { magov2: Record<string, unknown> };
    sources: unknown;
    render_engine: string;
  };
  local: {
    projectId: string;
    projectName: string;
    shotId: string;
    shotName: string;
    /** The source video being rendered from. */
    assetId: string;
    assetName: string;
    /** The local track the output clip belongs to. */
    outputTrackId: string;
    trimStartSeconds?: number;
    trimEndSeconds?: number;
  };
  model: string;
  fps: number;
  frameRange: [number, number];
  onProgress?: MirrorProgress;
}

const bridge = () => getLocalDesktopApi();

export const submitCloudRender = async (
  api: CloudApi,
  input: SubmitCloudRenderInput,
  removeCloudLayer: (cloudLayerId: string) => Promise<void> = deleteCloudLayer
): Promise<{ jobId: string; cloudAssetId: string }> => {
  const mirrored = await ensureMirroredShot(api, {
    localProjectId: input.local.projectId,
    projectName: input.local.projectName,
    localShotId: input.local.shotId,
    shotName: input.local.shotName,
    localAssetId: input.local.assetId,
    assetName: input.local.assetName,
    trimStartSeconds: input.local.trimStartSeconds,
    trimEndSeconds: input.local.trimEndSeconds,
    onProgress: input.onProgress
  });
  if (!mirrored.cloudLayerId) {
    throw new Error("The uploaded video has no cloud layer to render from");
  }

  // The cloud renderer rejects a range that runs past the last frame, unlike the
  // local ones, and reports nothing about why. Clamp to the frames that exist.
  const sourceInfo = await bridge().cloud.assetInfo(input.local.assetId);
  const { range: frameRange, clamped: isFrameRangeClampedToSource } =
    clampFrameRange(input.frameRange, sourceInfo?.frameCount);
  const requestedRenderSettings = input.payload.render_settings.magov2;
  const renderSettings = isFrameRangeClampedToSource
    ? alignFrameRangeDerivedSettings(
        requestedRenderSettings,
        frameRange,
        input.fps
      )
    : requestedRenderSettings;

  // Reference images are local assets the cloud has never seen, so each one is
  // mirrored and its id swapped before the render is submitted. Without this the
  // backend rejects the render with "Invalid source: asset not found or
  // inaccessible".
  const sources = await mirrorSourceImages(
    { ...(input.payload.sources as SourcesPayload) },
    (localAssetId) =>
      ensureCloudImageAsset(api, localAssetId, mirrored.cloudProjectId)
  );

  const isOutputLayerAlreadyInCloud = await isCloudProject(
    input.local.projectId
  );
  const outputLayerId = isOutputLayerAlreadyInCloud
    ? input.local.outputTrackId
    : await createCloudOutputLayer(api, {
        localOutputTrackId: input.local.outputTrackId,
        shotName: input.local.shotName,
        cloudTimelineId: mirrored.cloudTimelineId,
        cloudSourceLayerId: mirrored.cloudLayerId
      });
  const removeOutputLayerCreatedHere = isOutputLayerAlreadyInCloud
    ? async () => undefined
    : () => removeCloudLayer(outputLayerId);

  const submitted = await api
    .post<unknown>("/assets/add_render", {
      ...input.payload,
      parent_layer_id: outputLayerId,
      frame_range: frameRange,
      render_settings: {
        ...input.payload.render_settings,
        magov2: {
          ...renderSettings,
          frame_range: frameRange
        }
      },
      sources: { ...sources, video: mirrored.cloudLayerId }
    })
    .catch(async (submitError: unknown) => {
      await removeOutputLayerCreatedHere().catch(() => undefined);
      throw submitError;
    });
  const cloudAssetId = findCloudRenderAssetId(submitted);
  if (!cloudAssetId) {
    throw new Error("Cloud Mago did not return a render output asset");
  }

  const registered = await bridge().cloud.renders.register({
    outputTrackId: input.local.outputTrackId,
    sourceAssetId: input.local.assetId,
    model: input.model,
    frameRange,
    fps: input.fps,
    cloudAssetId,
    cloudOutputLayerId: outputLayerId,
    settings: renderSettings,
    sources: { ...(input.payload.sources as SourcesPayload) }
  });

  return { jobId: registered.jobId, cloudAssetId };
};
