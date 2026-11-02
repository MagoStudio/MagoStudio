import {
  EffectiveDurationLimits,
  isFrameBasedModelLimits,
  isTimeBasedDurationLimits,
  ModelLimits,
  VideoEngine
} from "@models/video/types";

import { isKlingModel } from "./isKlingModel";

export const getEffectiveLimits = (
  modelLimits: ModelLimits,
  isUnlimitedModeActive: boolean,
  isInterpolationEnabled: boolean,
  planMaxFrameRange: number | undefined,
  fps: number,
  maxFramesOverride?: number
): EffectiveDurationLimits => {
  const useInterpolation =
    isInterpolationEnabled && isFrameBasedModelLimits(modelLimits);

  const baseLimits: EffectiveDurationLimits = useInterpolation
    ? {
        minFrames: modelLimits.interpolationMinFrames ?? modelLimits.minFrames,
        maxFrames: modelLimits.interpolationMaxFrames ?? modelLimits.maxFrames
      }
    : isFrameBasedModelLimits(modelLimits)
      ? { minFrames: modelLimits.minFrames, maxFrames: modelLimits.maxFrames }
      : {
          minSeconds: modelLimits.minSeconds,
          maxSeconds: modelLimits.maxSeconds
        };

  if (maxFramesOverride != null && !isTimeBasedDurationLimits(baseLimits)) {
    return {
      minFrames: baseLimits.minFrames,
      maxFrames: Math.max(baseLimits.minFrames, maxFramesOverride)
    };
  }

  if (!isUnlimitedModeActive || planMaxFrameRange == null) {
    return baseLimits;
  }

  if (isTimeBasedDurationLimits(baseLimits)) {
    const planMaxSeconds = planMaxFrameRange / fps;
    return {
      minSeconds: baseLimits.minSeconds,
      maxSeconds: Math.min(baseLimits.maxSeconds, planMaxSeconds)
    };
  }

  return {
    minFrames: baseLimits.minFrames,
    maxFrames: Math.min(baseLimits.maxFrames, planMaxFrameRange)
  };
};

const DEFAULT_MIN_FRAME_BUFFER = 1;
const KLING_MIN_FRAME_BUFFER = 3;

export const getMinFrames = (
  limits: EffectiveDurationLimits,
  fps: number,
  engine?: VideoEngine
): number => {
  if (isTimeBasedDurationLimits(limits)) {
    const buffer = isKlingModel(engine)
      ? KLING_MIN_FRAME_BUFFER
      : DEFAULT_MIN_FRAME_BUFFER;
    return Math.ceil(limits.minSeconds * fps) + buffer;
  }
  return limits.minFrames;
};

export const getMaxFrames = (
  limits: EffectiveDurationLimits,
  fps: number
): number => {
  if (isTimeBasedDurationLimits(limits)) {
    return Math.floor(limits.maxSeconds * fps);
  }
  return limits.maxFrames;
};

export const toRangeLength = (frames: number): number =>
  Math.max(frames - 1, 0);

export const fromRangeLength = (length: number): number => length + 1;

export const getMinRangeLength = (
  limits: EffectiveDurationLimits,
  fps: number,
  engine?: VideoEngine
): number => {
  return toRangeLength(getMinFrames(limits, fps, engine));
};

export const getMaxRangeLength = (
  limits: EffectiveDurationLimits,
  fps: number
): number => {
  return toRangeLength(getMaxFrames(limits, fps));
};

export const getDurationFromFrameRange = (
  frameRange: number[] | [number, number],
  fps: number
): number => (frameRange[1] - frameRange[0]) / fps;
