import { getLocalDesktopApi } from "@/platform/localDesktop";

import {
  Img2ImgSettingsPayload,
  mirrorImg2ImgSettings
} from "./mirrorImg2ImgSettings";
import {
  CloudApi,
  ensureCloudImageAsset,
  ensureMirroredShot,
  MirrorProgress
} from "./mirrorService";

/**
 * Submits an img2img render to cloud Mago and records it locally.
 *
 * The video sibling of this is `submitCloudRender`, and the shape is the same:
 * mirror the shot, submit, then create the local rows last because they carry
 * the cloud ids and are what makes the job appear in the editor.
 *
 * Two differences from the video path, both from the backend's own contract:
 *
 * - There is no output layer to create first. `/assets/img2img/render` returns
 *   the IMG2IMG layer it made itself, so nothing needs `parent_layer_id`.
 * - `source_asset` is the mirrored *asset* id, where a video render's
 *   `sources.video` is the mirrored *layer* id.
 */

export interface SubmitCloudImg2ImgRenderInput {
  /** The `/assets/img2img/render` body, minus the ids this fills in. */
  payload: {
    settings: Img2ImgSettingsPayload;
    frame: number;
    img_file_type: string;
    render_mode: string;
    render_model: string;
    name?: string;
  };
  local: {
    projectId: string;
    projectName: string;
    shotId: string;
    shotName: string;
    /** The source video the frame came from. */
    assetId: string;
    assetName: string;
  };
  onProgress?: MirrorProgress;
}

const bridge = () => getLocalDesktopApi();

/**
 * The output asset and clip id, on the last clip of the layer the backend
 * returned. The clip id matters as much as the asset id here: img2img has no
 * project-wide queue the way video does, so `GET
 * /assets/img2img/status/{clipId}` -- keyed by the *clip*, not the asset -- is
 * the only way to learn when this render finishes. Without it the job was
 * submitted correctly and the backend completed it, but nothing here ever
 * asked about it again.
 */
const findRenderClip = (
  response: unknown
): { assetId: string; clipId: string } | null => {
  const clips = (
    response as { clips?: { id?: unknown; asset?: { id?: unknown } }[] }
  )?.clips;
  if (!Array.isArray(clips)) return null;
  for (const clip of [...clips].reverse()) {
    const assetId = clip?.asset?.id;
    const clipId = clip?.id;
    if (
      typeof assetId === "string" &&
      assetId &&
      typeof clipId === "string" &&
      clipId
    ) {
      return { assetId, clipId };
    }
  }
  return null;
};

export const submitCloudImg2ImgRender = async (
  api: CloudApi,
  input: SubmitCloudImg2ImgRenderInput
): Promise<{ jobId: string; cloudAssetId: string }> => {
  const mirrored = await ensureMirroredShot(api, {
    localProjectId: input.local.projectId,
    projectName: input.local.projectName,
    localShotId: input.local.shotId,
    shotName: input.local.shotName,
    localAssetId: input.local.assetId,
    assetName: input.local.assetName,
    onProgress: input.onProgress
  });

  // Reference images and an uploaded or iterated input image are local assets
  // the cloud has never seen, so each is mirrored and its id swapped.
  const settings = await mirrorImg2ImgSettings(
    input.payload.settings,
    (localAssetId) =>
      ensureCloudImageAsset(api, localAssetId, mirrored.cloudProjectId)
  );

  const submitted = await api.post<unknown>("/assets/img2img/render", {
    ...input.payload,
    settings,
    source_asset: mirrored.cloudAssetId,
    timeline_id: mirrored.cloudTimelineId
  });
  const clip = findRenderClip(submitted);
  if (!clip) {
    throw new Error("Cloud Mago did not return a render output asset");
  }

  const { input_image: _inlineInputImage, ...localSettingsToRecord } =
    input.payload.settings;

  const registered = await bridge().cloud.renders.registerImage({
    projectId: input.local.projectId,
    shotId: input.local.shotId,
    sourceAssetId: input.local.assetId,
    model: input.payload.render_model,
    frame: input.payload.frame,
    name: input.payload.name ?? input.local.shotName,
    cloudAssetId: clip.assetId,
    cloudClipId: clip.clipId,
    settings: localSettingsToRecord
  });

  return { jobId: registered.jobId, cloudAssetId: clip.assetId };
};
