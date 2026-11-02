import { VideoEngine } from "@models/video/types";

export const isMaskModel = (
  engine: VideoEngine | string | undefined
): boolean => engine === VideoEngine.v1_0_0_mask;
