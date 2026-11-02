import { PERCENTAGE_MULTIPLIER } from "@constants";
import { useAdjustedFrameRange } from "@domains/renders/useAdjustedFrameRange";
import { useMaskRangeValidation } from "@domains/renders/useMaskRangeValidation";
import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { trackRangeAtom } from "@store/atoms/trackRangeAtom";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { cn } from "@utils";
import { useAtomValue } from "jotai";

import { useIsRangeOutOfBounds } from "../../../TimePanel/RangeSlider/helpers/useIsRangeOutOfBounds";

const SELECTED_RANGE_BOX_BORDER_PX = 4;

export const SelectedRangeBox: React.FC = () => {
  const trackRange = useAtomValue(trackRangeAtom);
  const shotMaxFrames = useShotMaxFrames();
  const { renderSettingsValuesAtom, selectedModelAtom } =
    useRenderSettingsAtoms();
  const renderSettingsValues = useAtomValue(renderSettingsValuesAtom);
  const selectedModel = useAtomValue(selectedModelAtom);

  const [rangeMin, rangeMax] = trackRange;

  const isOutOfBounds = useIsRangeOutOfBounds(rangeMin, rangeMax);
  const adjustedFrameRange = useAdjustedFrameRange();
  const maskRangeError = useMaskRangeValidation({
    selectedModelName: selectedModel.name,
    renderSettingsValues,
    rangeFrames: adjustedFrameRange
  });
  const hasError = isOutOfBounds || !!maskRangeError;

  if (!shotMaxFrames || rangeMax === 0 || rangeMin >= rangeMax) {
    return null;
  }

  const leftPercent = (rangeMin / shotMaxFrames) * PERCENTAGE_MULTIPLIER;
  const widthPercent =
    ((rangeMax - rangeMin) / shotMaxFrames) * PERCENTAGE_MULTIPLIER;

  return (
    <div className="absolute top-[-3px] bottom-[-3px] left-0 right-3 pointer-events-none z-[1]">
      <div
        className={cn(
          "absolute top-0 bottom-0 border-4 rounded-lg",
          hasError ? "border-element-error" : "border-element-in-progress"
        )}
        style={{
          left: `calc(${leftPercent}% - ${SELECTED_RANGE_BOX_BORDER_PX}px)`,
          width: `calc(${widthPercent}% + ${SELECTED_RANGE_BOX_BORDER_PX * 2}px)`
        }}
      />
    </div>
  );
};
