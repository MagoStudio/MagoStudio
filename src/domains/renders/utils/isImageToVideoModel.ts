import { VideoEngine } from "@models/video/types";

const IMAGE_TO_VIDEO_ENGINES = new Set<string>([
  VideoEngine.seedance_2_i2v,
  VideoEngine.seedance_2_i2v_fast
]);

export const isImageToVideoModel = (
  engine: VideoEngine | string | undefined
): boolean => {
  if (!engine) return false;
  return IMAGE_TO_VIDEO_ENGINES.has(engine);
};
