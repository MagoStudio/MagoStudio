import { useRenderDurationLimits } from "@domains/renders/useRenderDurationLimits";
import { getAdjustedFrameRange } from "@domains/renders/utils/getAdjustedFrameRange";
import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { trackRangeAtom } from "@store/atoms/trackRangeAtom";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue } from "jotai";

export const useAdjustedFrameRange = (): [number, number] => {
  const trackRange = useAtomValue(trackRangeAtom);
  const shotMaxFrames = useShotMaxFrames();
  const { renderSettingsValuesAtom } = useRenderSettingsAtoms();
  const renderSettingsValues = useAtomValue(renderSettingsValuesAtom);
  const { minFrames } = useRenderDurationLimits();

  return getAdjustedFrameRange({
    trackRange,
    shotMaxFrames,
    minFrames,
    isInterpolationEnabled: !!renderSettingsValues.enable_interpolation
  });
};
