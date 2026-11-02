import { isComfyLocalImageModel } from "@platform/localImageModels";
import { isComfyLocalVideoModel } from "@platform/localVideoModels";

import { imageRenderTarget, videoRenderTarget } from "@/platform/renderTarget";

/** Only local Comfy models require a local endpoint. */

export type LocalRenderPrecondition = "comfy" | "none";

export const videoRenderPrecondition = (
  model: string | undefined,
  options: { isLocalApp: boolean }
): LocalRenderPrecondition => {
  if (!options.isLocalApp) return "none";
  if (videoRenderTarget(model) === "cloud") return "none";
  return isComfyLocalVideoModel(model) ? "comfy" : "none";
};

export const imageRenderPrecondition = (
  model: string | undefined,
  options: { isLocalApp: boolean }
): LocalRenderPrecondition => {
  if (!options.isLocalApp) return "none";
  if (imageRenderTarget(model) === "cloud") return "none";
  return isComfyLocalImageModel(model) ? "comfy" : "none";
};
