import { ComputedRenderLimits } from "@models/video/types";
import type { TFunction } from "i18next";

export const getRangeValidationMessage = ({
  range,
  isInterpolationEnabled,
  t,
  limits,
  isRelaxedEnabled
}: {
  range: number;
  isInterpolationEnabled: boolean;
  t: TFunction;
  limits: ComputedRenderLimits;
  isRelaxedEnabled: boolean;
}): string | undefined => {
  const {
    minFrames,
    maxFrames,
    modelHasTimeBasedDurationLimits,
    minSeconds,
    maxSeconds
  } = limits;

  if (range < minFrames) {
    if (modelHasTimeBasedDurationLimits && minSeconds !== undefined) {
      return t("range.min_duration_seconds.description", { minSeconds });
    }

    if (isInterpolationEnabled) {
      return t("range.interpolation_min_range.description", {
        minFrames
      });
    }
    return t("range.no_interpolation_min_range.description", {
      minDefault: minFrames
    });
  }

  if (range > maxFrames) {
    if (modelHasTimeBasedDurationLimits && maxSeconds !== undefined) {
      return t("range.max_duration_seconds.description", { maxSeconds });
    }

    if (isRelaxedEnabled) {
      return t("range.max_in_relaxed_mode.description", {
        maxFrames
      });
    }
    return t("range.max_in_credits_mode.description", {
      maxCredits: maxFrames
    });
  }

  return undefined;
};
