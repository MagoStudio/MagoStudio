import { VideoEngine } from "@models/video/types";

const MAGO_ENGINES = new Set<string>([
  VideoEngine.V2_5_0,
  VideoEngine.V3_1_0,
  VideoEngine.V3_2_0,
  VideoEngine.V3_3_0,
  VideoEngine.V3_3_0_CNETS,
  VideoEngine.V3_4_0,
  VideoEngine.V4_0_0,
  VideoEngine.V4_1_0,
  VideoEngine.V5_0_0,
  VideoEngine.V5_1_0
]);

export const isMagoEngine = (
  engine: VideoEngine | string | undefined
): boolean => {
  if (!engine) return false;
  return MAGO_ENGINES.has(engine);
};
