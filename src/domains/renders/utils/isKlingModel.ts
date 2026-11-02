import { VideoEngine } from "@models/video/types";

const KLING_ENGINES = new Set<string>([
  VideoEngine.kling_o1,
  VideoEngine.kling_2_6_motion_control,
  VideoEngine.kling_3_motion_control,
  VideoEngine.kling_o3_edit_pro
]);

export const isKlingModel = (
  engine: VideoEngine | string | undefined
): boolean => {
  if (!engine) return false;
  return KLING_ENGINES.has(engine);
};
