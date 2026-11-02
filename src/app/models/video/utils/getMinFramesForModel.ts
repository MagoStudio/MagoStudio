import {
  isTimeBasedDurationLimits,
  VideoModelDefinition
} from "@models/video/types";

export const getMinFramesForModel = (
  model: VideoModelDefinition,
  fps: number
): number => {
  const modelLimits = model.renderDurationLimits.modelLimits;
  if (isTimeBasedDurationLimits(modelLimits)) {
    return Math.ceil(modelLimits.minSeconds * fps);
  }
  return modelLimits.minFrames;
};
