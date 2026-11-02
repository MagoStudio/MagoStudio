import { VideoEngine } from "@models/video/types";
import { getVideoModelByEngine } from "@models/video/utils/getVideoModelByEngine";

export const doesModelDisableFacemeshBlending = (
  engine: VideoEngine | string | undefined
): boolean => {
  return (
    getVideoModelByEngine(engine)?.capabilities.supportsFacemeshBlending ===
    false
  );
};
