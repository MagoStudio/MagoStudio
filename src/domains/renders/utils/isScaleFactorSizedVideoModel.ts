import { VideoEngine } from "@models/video/types";

const SCALE_FACTOR_SIZED_ENGINES = new Set<VideoEngine | string>([
  VideoEngine.v1_0_0_upscaler,
  VideoEngine.v2_0_0_esrgan_upscaler
]);

export const isScaleFactorSizedVideoModel = (
  engine: VideoEngine | string | undefined
): boolean => {
  if (!engine) return false;
  return SCALE_FACTOR_SIZED_ENGINES.has(engine);
};
