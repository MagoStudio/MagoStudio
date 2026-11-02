import { useCurrentPlanType } from "@domains/payment/useCurrentPlanType";
import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { usePlanMaxFrameRange } from "@domains/payment/usePlanMaxFrameRange";
import { useRenderDurationLimits } from "@domains/renders/useRenderDurationLimits";
import { toRangeLength } from "@domains/renders/utils/frameDurationLimits";
import { useFpsForShot } from "@domains/videoPlayer/useFpsForShot";
import { SubscriptionType } from "@schemas/balance";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue } from "jotai";

export const useRangeManagement = () => {
  const { isUnlimitedModeActive } = useIsUnlimitedModeActive();
  const { data: currentPlanType = SubscriptionType.FREE } =
    useCurrentPlanType();
  const { renderSettingsValuesAtom, selectedModelAtom } =
    useRenderSettingsAtoms();
  const values = useAtomValue(renderSettingsValuesAtom);
  const selectedModel = useAtomValue(selectedModelAtom);
  const { fps } = useFpsForShot();
  const { minFrames, maxFrames } = useRenderDurationLimits();
  const planMaxFrameRange = usePlanMaxFrameRange();

  const isInterpolationEnabled = !!values?.enable_interpolation;

  return {
    isInterpolationEnabled,
    minRangeLength: toRangeLength(minFrames),
    maxRangeLength: toRangeLength(maxFrames),
    selectedModel,
    currentPlanType,
    isUnlimitedModeActive,
    planMaxFrameRange,
    fps
  };
};
