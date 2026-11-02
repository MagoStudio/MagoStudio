import { VideoEngine } from "@models/video/types";

import { isImageToVideoModel } from "./isImageToVideoModel";
import { isMaskModel } from "./isMaskModel";
import { isUpscaleModel } from "./isUpscaleModel";

export type EngineFamily = "render" | "upscale" | "mask" | "image-to-video";

export const getEngineFamily = (
  engine: VideoEngine | string | undefined
): EngineFamily => {
  if (!engine) return "render";
  if (isMaskModel(engine)) return "mask";
  if (isUpscaleModel(engine)) return "upscale";
  if (isImageToVideoModel(engine)) return "image-to-video";
  return "render";
};
