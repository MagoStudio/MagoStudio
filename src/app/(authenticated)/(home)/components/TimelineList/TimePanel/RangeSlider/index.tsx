import { Message } from "@components/Message";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useAdjustedFrameRange } from "@domains/renders/useAdjustedFrameRange";
import { useMaskRangeValidation } from "@domains/renders/useMaskRangeValidation";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { currentVideoFrameAtom } from "@store/atoms";
import { trackRangeAtom } from "@store/atoms/trackRangeAtom";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { cn } from "@utils";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useState, useRef, useMemo } from "react";
import { Slider, SliderThumb, SliderTrack } from "react-aria-components/Slider";
import { useTranslation } from "react-i18next";

import { useIsRangeOutOfBounds } from "./helpers/useIsRangeOutOfBounds";
import { useRangeManagement } from "./helpers/useRangeManagement";
import { useRangeSideEffects } from "./helpers/useRangeSideEffects";
import { useRangeValidation } from "./helpers/useRangeValidation";
import { useTrackDrag } from "./helpers/useTrackDrag";
import { WarningSliderTooltip } from "./WarningSliderTooltip";

const DEFAULT_DISABLED_RANGE_MAX = 400;
const MOUSE_ACTION_DELAY = 100;
const PERCENT_MULTIPLIER = 100;

interface Props {
  disabled?: boolean;
}

export const RangeSlider: React.FC<Props> = ({ disabled }) => {
  const rangeConfig = useRangeManagement();
  const shotMaxFrames = useShotMaxFrames();
  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();
  const setCurrentVideoFrame = useSetAtom(currentVideoFrameAtom);
  const trackRange = useAtomValue(trackRangeAtom);
  const setTrackRange = useSetAtom(trackRangeAtom);

  useRangeSideEffects({
    shotMaxFrames,
    selectedProjectId,
    selectedShotId,
    onRangeChange: setTrackRange,
    ...rangeConfig
  });

  const {
    isTrackDragOn,
    setIsTrackDragOn,
    handleTrackDragStart,
    handleTrackDragMove
  } = useTrackDrag({
    trackRange,
    shotMaxFrames,
    onRangeChange: setTrackRange,
    onFrameChange: setCurrentVideoFrame
  });

  const [isMouseDown, setIsMouseDown] = useState(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const { invalidRange, validateAndSetRange } = useRangeValidation({
    trackRange,
    shotMaxFrames,
    ...rangeConfig
  });

  const constrainedRangeMin = Math.min(trackRange[0], shotMaxFrames);
  const constrainedRangeMax = Math.min(trackRange[1], shotMaxFrames);

  const isOutOfBounds = useIsRangeOutOfBounds(
    constrainedRangeMin,
    constrainedRangeMax
  );

  const { t } = useTranslation();
  const { renderSettingsValuesAtom, selectedModelAtom } =
    useRenderSettingsAtoms();
  const renderSettingsValues = useAtomValue(renderSettingsValuesAtom);
  const selectedModel = useAtomValue(selectedModelAtom);
  const adjustedFrameRange = useAdjustedFrameRange();
  const maskRangeError = useMaskRangeValidation({
    selectedModelName: selectedModel.name,
    renderSettingsValues,
    rangeFrames: adjustedFrameRange
  });
  const hasMaskRangeError = !!maskRangeError;
  const hasError = isOutOfBounds || hasMaskRangeError;

  const sliderValue = useMemo(
    () => [
      constrainedRangeMin,
      disabled ? DEFAULT_DISABLED_RANGE_MAX : constrainedRangeMax
    ],
    [constrainedRangeMin, constrainedRangeMax, disabled]
  );

  const onSliderChange = (newValue: number[]) => {
    if (!selectedProjectId) return;

    const changedHandle =
      newValue[0] !== trackRange[0]
        ? "start"
        : newValue[1] !== trackRange[1]
          ? "end"
          : null;

    if (!changedHandle) return;

    const result = validateAndSetRange(
      newValue,
      isMouseDown,
      setTrackRange,
      undefined,
      changedHandle
    );

    if (result) {
      const cursorFrame =
        result.changedHandle === "start" ? result.range[0] : result.range[1];
      setCurrentVideoFrame(cursorFrame);
    }
  };

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setIsMouseDown(true);
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  const handleChangeEnd = useCallback(() => {
    setTimeout(() => {
      setIsMouseDown(false);

      if (isOutOfBounds) {
        validateAndSetRange(
          [trackRange[0], trackRange[1]],
          false,
          setTrackRange,
          setCurrentVideoFrame
        );
      }
    }, MOUSE_ACTION_DELAY);
  }, [
    isOutOfBounds,
    trackRange,
    validateAndSetRange,
    setTrackRange,
    setCurrentVideoFrame
  ]);

  const handleTrackDragEnd = () => {
    setIsTrackDragOn(false);
  };

  const trackLeftPercent =
    shotMaxFrames > 0
      ? (sliderValue[0] / shotMaxFrames) * PERCENT_MULTIPLIER
      : 0;
  const trackWidthPercent =
    shotMaxFrames > 0
      ? ((sliderValue[1] - sliderValue[0]) / shotMaxFrames) * PERCENT_MULTIPLIER
      : 0;

  return (
    <>
      <Slider
        aria-label="Range slider"
        isDisabled={disabled}
        maxValue={shotMaxFrames}
        minValue={0}
        onChange={onSliderChange}
        onChangeEnd={handleChangeEnd}
        ref={sliderRef}
        value={sliderValue}
        className={cn(
          "relative z-30 inline-flex items-center h-6 w-full cursor-pointer touch-none",
          disabled && "pointer-events-none cursor-default"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <SliderTrack className="absolute w-full h-2 bg-element-primary-active">
          {!disabled && (
            <div
              className={cn(
                "absolute h-2",
                hasError ? "bg-element-error" : "bg-element-additional-active"
              )}
              style={{
                left: `${trackLeftPercent}%`,
                width: `${trackWidthPercent}%`
              }}
            >
              <div
                className={cn(
                  "absolute left-2 right-2 z-30 top-[-7px] bottom-[-7px] h-[calc(100%+14px)] cursor-grab",
                  isTrackDragOn && "fixed left-0 cursor-grabbing"
                )}
                onPointerDown={handleTrackDragStart}
                onPointerUp={handleTrackDragEnd}
                onPointerLeave={handleTrackDragEnd}
                onPointerMove={handleTrackDragMove}
              />
            </div>
          )}
          <SliderThumb
            index={0}
            className={cn(
              "absolute z-0 flex items-center justify-center h-4 w-4 top-[12px] -translate-y-1/2 cursor-grab data-[dragging]:cursor-grabbing",
              "bg-[url('/assets/icons/16-technical/range-selector.svg')] bg-cover bg-center bg-no-repeat",
              disabled && "hidden"
            )}
          />
          <SliderThumb
            index={1}
            className={cn(
              "absolute z-0 flex items-center justify-center h-4 w-4 top-[12px] -translate-y-1/2 cursor-grab data-[dragging]:cursor-grabbing",
              "bg-[url('/assets/icons/16-technical/range-selector.svg')] bg-cover bg-center bg-no-repeat",
              disabled && "hidden"
            )}
          />
        </SliderTrack>
      </Slider>
      {invalidRange && (
        <WarningSliderTooltip range={invalidRange} anchorRef={sliderRef} />
      )}
      {isOutOfBounds && (
        <Message
          variant="error"
          anchorRef={sliderRef}
          placement="bottom"
          offset={20}
          className="max-w-[var(--width-timeline-tools)] truncate"
        >
          You are trying to select empty space
        </Message>
      )}
      {!isOutOfBounds && hasMaskRangeError && (
        <Message
          variant="error"
          anchorRef={sliderRef}
          placement="bottom"
          offset={20}
          className="max-w-[var(--width-timeline-tools)] truncate"
        >
          {t(
            `inpainting.mask_range_error.${maskRangeError.kind}.timeline_pill`
          )}
        </Message>
      )}
    </>
  );
};
