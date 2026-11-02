import {
  getEffectiveLimits,
  getMaxRangeLength as getMaxRangeLengthUtil,
  getMinRangeLength as getMinRangeLengthUtil
} from "@domains/renders/utils/frameDurationLimits";
import { VideoModelDefinition } from "@models/video/types";

import { isComfyLocalVideoModel } from "@/platform/localVideoModels";

const getMinRangeLength = ({
  isInterpolationEnabled,
  selectedModel,
  fps,
  isRelaxedEnabled,
  planMaxFrameRange
}: {
  isInterpolationEnabled: boolean;
  selectedModel: VideoModelDefinition;
  fps: number;
  isRelaxedEnabled: boolean;
  planMaxFrameRange: number | undefined;
}) => {
  const effectiveLimits = getEffectiveLimits(
    selectedModel.renderDurationLimits.modelLimits,
    isRelaxedEnabled,
    isInterpolationEnabled,
    planMaxFrameRange,
    fps
  );
  return getMinRangeLengthUtil(effectiveLimits, fps, selectedModel.name);
};

const getMaxRangeLength = ({
  selectedModel,
  planMaxFrameRange,
  isRelaxedEnabled,
  fps,
  shotMaxFrames
}: {
  selectedModel: VideoModelDefinition;
  planMaxFrameRange: number | undefined;
  isRelaxedEnabled: boolean;
  fps: number;
  shotMaxFrames: number;
}) => {
  const effectiveLimits = getEffectiveLimits(
    selectedModel.renderDurationLimits.modelLimits,
    isRelaxedEnabled,
    false,
    planMaxFrameRange,
    fps,
    isComfyLocalVideoModel(selectedModel.name) ? shotMaxFrames + 1 : undefined
  );
  return getMaxRangeLengthUtil(effectiveLimits, fps);
};

const handleNewValueMin = ({
  currentMin,
  currentMax,
  newMin,
  shotMaxFrames,
  isInterpolationEnabled,
  selectedModel,
  planMaxFrameRange,
  isRelaxedEnabled,
  fps
}: {
  currentMin: number;
  currentMax: number;
  newMin: number;
  shotMaxFrames: number;
  isInterpolationEnabled: boolean;
  selectedModel: VideoModelDefinition;
  planMaxFrameRange: number | undefined;
  isRelaxedEnabled: boolean;
  fps: number;
}) => {
  const maxRangeLength = getMaxRangeLength({
    selectedModel,
    planMaxFrameRange,
    isRelaxedEnabled,
    fps,
    shotMaxFrames
  });
  const minRangeLength = getMinRangeLength({
    isInterpolationEnabled,
    selectedModel,
    fps,
    isRelaxedEnabled,
    planMaxFrameRange
  });

  if (currentMin === newMin) {
    return {
      newMin: currentMin,
      newMax: currentMax
    };
  }

  if (newMin >= shotMaxFrames) {
    return {
      newMin: shotMaxFrames - minRangeLength,
      newMax: shotMaxFrames
    };
  }

  const newDifference = currentMax - newMin;
  const currentDifference = currentMax - currentMin;

  if (newMin < 0 && newDifference <= maxRangeLength) {
    return {
      newMin: 0,
      newMax: currentMax
    };
  }

  if (newMin < 0 && newDifference > maxRangeLength) {
    return {
      newMin: 0,
      newMax: maxRangeLength
    };
  }

  if (newMin < currentMin && newDifference <= maxRangeLength) {
    return {
      newMin: newMin,
      newMax: currentMax
    };
  }

  if (
    isRelaxedEnabled &&
    newMin < currentMin &&
    newDifference > maxRangeLength
  ) {
    return {
      newMin: newMin,
      newMax: currentMax
    };
  }

  if (newMin < currentMax && newDifference > maxRangeLength) {
    return {
      newMin: newMin,
      newMax: newMin + maxRangeLength
    };
  }

  if (
    newMin > currentMin &&
    newMin < currentMax &&
    newDifference >= minRangeLength
  ) {
    return {
      newMin: newMin,
      newMax: currentMax
    };
  }

  if (
    newMin > currentMin &&
    newMin < currentMax &&
    newDifference < minRangeLength &&
    currentMax + minRangeLength <= shotMaxFrames
  ) {
    return {
      newMin: newMin,
      newMax: newMin + minRangeLength
    };
  }

  if (
    newMin > currentMin &&
    newMin < currentMax &&
    newDifference < minRangeLength &&
    currentMax + minRangeLength > shotMaxFrames
  ) {
    return {
      newMin: shotMaxFrames - minRangeLength,
      newMax: shotMaxFrames
    };
  }

  if (
    newMin > currentMin &&
    newMin === currentMax &&
    shotMaxFrames - currentMax >= minRangeLength
  ) {
    return {
      newMin: newMin,
      newMax: newMin + minRangeLength
    };
  }

  if (
    newMin > currentMin &&
    newMin === currentMax &&
    shotMaxFrames - currentMax < minRangeLength
  ) {
    return {
      newMin: shotMaxFrames - minRangeLength,
      newMax: shotMaxFrames
    };
  }

  if (newMin > currentMax && newMin + currentDifference <= shotMaxFrames) {
    return {
      newMin: newMin,
      newMax: newMin + currentDifference
    };
  }

  if (newMin > currentMax && newMin + minRangeLength <= shotMaxFrames) {
    return {
      newMin: newMin,
      newMax: Math.min(newMin + currentDifference, shotMaxFrames)
    };
  }

  if (newMin > currentMax && newMin + minRangeLength >= shotMaxFrames) {
    return {
      newMin: shotMaxFrames - minRangeLength,
      newMax: shotMaxFrames
    };
  }

  if (newMin > shotMaxFrames) {
    return {
      newMin: shotMaxFrames - minRangeLength,
      newMax: shotMaxFrames
    };
  }

  console.error("validateRange: unhandled min range case", {
    currentMin,
    currentMax,
    newMin,
    shotMaxFrames
  });
  return { newMin: currentMin, newMax: currentMax };
};

const handleNewValueMax = ({
  currentMin,
  currentMax,
  newMax,
  shotMaxFrames,
  isInterpolationEnabled,
  selectedModel,
  planMaxFrameRange,
  isRelaxedEnabled,
  fps
}: {
  currentMin: number;
  currentMax: number;
  newMax: number;
  shotMaxFrames: number;
  isInterpolationEnabled: boolean;
  selectedModel: VideoModelDefinition;
  planMaxFrameRange: number | undefined;
  isRelaxedEnabled: boolean;
  fps: number;
}) => {
  const maxRangeLength = getMaxRangeLength({
    selectedModel,
    planMaxFrameRange,
    isRelaxedEnabled,
    fps,
    shotMaxFrames
  });
  const minRangeLength = getMinRangeLength({
    isInterpolationEnabled,
    selectedModel,
    fps,
    isRelaxedEnabled,
    planMaxFrameRange
  });

  if (currentMax === newMax) {
    return {
      newMin: currentMin,
      newMax: currentMax
    };
  }

  const newDifference = newMax - currentMin;
  const currentDiff = currentMax - currentMin;

  if (newMax > shotMaxFrames && newDifference <= maxRangeLength) {
    return {
      newMin: currentMin,
      newMax: shotMaxFrames
    };
  }

  if (newMax > shotMaxFrames && newDifference > maxRangeLength) {
    return {
      newMin: shotMaxFrames - currentDiff,
      newMax: shotMaxFrames
    };
  }

  if (newMax > currentMax && newDifference <= maxRangeLength) {
    return {
      newMin: currentMin,
      newMax: newMax
    };
  }

  if (newMax > currentMax && newDifference > maxRangeLength) {
    return {
      newMin: newMax - maxRangeLength,
      newMax: newMax
    };
  }

  if (
    newMax < currentMax &&
    newMax > currentMin &&
    newDifference >= minRangeLength
  ) {
    return {
      newMin: currentMin,
      newMax: newMax
    };
  }

  if (
    newMax < currentMax &&
    newMax > currentMin &&
    newDifference < minRangeLength
  ) {
    return {
      newMin: Math.max(newMax - minRangeLength, 0),
      newMax: Math.max(newMax, minRangeLength)
    };
  }

  if (
    newMax < currentMax &&
    newMax > currentMin &&
    newDifference < minRangeLength
  ) {
    return {
      newMin: newMax - minRangeLength,
      newMax: newMax
    };
  }

  if (
    newMax < currentMax &&
    newMax > currentMin &&
    newDifference < minRangeLength &&
    currentMin >= minRangeLength
  ) {
    return {
      newMin: newMax - minRangeLength,
      newMax: newMax
    };
  }

  if (
    newMax < currentMax &&
    newMax > currentMin &&
    newDifference < minRangeLength &&
    currentMin <= minRangeLength
  ) {
    return {
      newMin: 0,
      newMax: minRangeLength
    };
  }

  if (newMax < currentMax && newMax >= currentDiff) {
    return {
      newMin: newMax - currentDiff,
      newMax: newMax
    };
  }

  if (newMax < currentMax && newMax < currentDiff && newMax >= minRangeLength) {
    return {
      newMin: Math.max(newMax - currentDiff, 0),
      newMax: newMax
    };
  }

  if (newMax < currentMax && newMax <= minRangeLength) {
    return {
      newMin: 0,
      newMax: minRangeLength
    };
  }

  console.error("validateRange: unhandled max range case", {
    currentMin,
    currentMax,
    newMax,
    shotMaxFrames
  });
  return { newMin: currentMin, newMax: currentMax };
};

export const validateRange = ({
  currentMin,
  currentMax,
  newValue,
  isNewValueMin,
  shotMaxFrames,
  isInterpolationEnabled,
  selectedModel,
  planMaxFrameRange,
  isRelaxedEnabled,
  fps
}: {
  currentMin: number;
  currentMax: number;
  newValue: number;
  isNewValueMin: boolean;
  shotMaxFrames: number;
  isInterpolationEnabled: boolean;
  selectedModel: VideoModelDefinition;
  planMaxFrameRange: number | undefined;
  isRelaxedEnabled: boolean;
  fps: number;
}) => {
  if (isNewValueMin) {
    const { newMin, newMax } = handleNewValueMin({
      currentMin,
      currentMax,
      newMin: newValue,
      shotMaxFrames,
      isInterpolationEnabled,
      selectedModel,
      planMaxFrameRange,
      isRelaxedEnabled,
      fps
    });

    return { newMin, newMax };
  }

  const { newMin, newMax } = handleNewValueMax({
    currentMin,
    currentMax,
    newMax: newValue,
    shotMaxFrames,
    isInterpolationEnabled,
    selectedModel,
    planMaxFrameRange,
    isRelaxedEnabled,
    fps
  });

  return { newMin, newMax };
};
