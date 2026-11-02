import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { usePlanMaxFrameRange } from "@domains/payment/usePlanMaxFrameRange";
import {
  getEffectiveLimits,
  getMaxFrames,
  getMinFrames
} from "@domains/renders/utils/frameDurationLimits";
import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { useFpsForShot } from "@domains/videoPlayer/useFpsForShot";
import {
  ComputedRenderLimits,
  isTimeBasedDurationLimits
} from "@models/video/types";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue } from "jotai";

import { isComfyLocalVideoModel } from "@/platform/localVideoModels";

export const useRenderDurationLimits = (): ComputedRenderLimits => {
  const { isUnlimitedModeActive } = useIsUnlimitedModeActive();
  const planMaxFrameRange = usePlanMaxFrameRange();
  const { renderSettingsValuesAtom, selectedModelAtom } =
    useRenderSettingsAtoms();
  const values = useAtomValue(renderSettingsValuesAtom);
  const selectedModel = useAtomValue(selectedModelAtom);
  const { fps } = useFpsForShot();
  const shotMaxFrames = useShotMaxFrames();

  const isInterpolationEnabled = !!values?.enable_interpolation;

  const effectiveLimits = getEffectiveLimits(
    selectedModel.renderDurationLimits.modelLimits,
    isUnlimitedModeActive,
    isInterpolationEnabled,
    planMaxFrameRange,
    fps,
    isComfyLocalVideoModel(selectedModel.name) && shotMaxFrames > 0
      ? shotMaxFrames + 1
      : undefined
  );

  const minFrames = getMinFrames(effectiveLimits, fps, selectedModel.name);
  const maxFrames = getMaxFrames(effectiveLimits, fps);
  const modelHasTimeBasedDurationLimits =
    isTimeBasedDurationLimits(effectiveLimits);

  return {
    minFrames,
    maxFrames,
    modelHasTimeBasedDurationLimits,
    ...(modelHasTimeBasedDurationLimits && {
      minSeconds: effectiveLimits.minSeconds,
      maxSeconds: effectiveLimits.maxSeconds
    })
  };
};
