import { RENDER_MODELS } from "@models/video/constants";
import { VideoEngine, VideoModelDefinition } from "@models/video/types";

export const getVideoModelByEngine = (
  engine: VideoEngine | string | undefined
): VideoModelDefinition | undefined => {
  if (!engine) return undefined;
  return RENDER_MODELS.find((model) => model.name === engine);
};
