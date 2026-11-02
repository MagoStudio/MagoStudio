import { UPSCALE_MODELS } from "@models/video/constants";
import { VideoEngine } from "@models/video/types";

const UPSCALE_ENGINES = new Set<string>(UPSCALE_MODELS);

export const isUpscaleModel = (
  engine: VideoEngine | string | undefined
): boolean => {
  if (!engine) return false;
  return UPSCALE_ENGINES.has(engine);
};
