import { VideoEngine } from "@models/video/types";
import { getVideoModelByEngine } from "@models/video/utils/getVideoModelByEngine";

export const doesModelSupportVideoReferenceToggle = (
  engine: VideoEngine | string | undefined
): boolean => {
  return (
    getVideoModelByEngine(engine)?.capabilities.supportsVideoReferenceToggle ===
    true
  );
};
