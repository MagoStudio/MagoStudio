import { Input } from "@components/Input";
import { Text } from "@components/Text";
import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { usePlanMaxFrameRange } from "@domains/payment/usePlanMaxFrameRange";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useRenderDurationLimits } from "@domains/renders/useRenderDurationLimits";
import { toRangeLength } from "@domains/renders/utils/frameDurationLimits";
import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { useFpsForShot } from "@domains/videoPlayer/useFpsForShot";
import { trackingWithProjectId } from "@hooks/tracking/trackingUtils";
import { isPlayingAtom } from "@store/atoms";
import { invalidRangeAtom, trackRangeAtom } from "@store/atoms/trackRangeAtom";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { useForm, Controller } from "react-hook-form";

import { isRangeValid } from "../../TimePanel/RangeSlider/helpers/isRangeValid";

import { validateRange } from "./validateRange";

interface Props {
  disabled?: boolean;
}

interface FormValues {
  rangeMin: string;
  rangeMax: string;
}

export const RangeInput: React.FC<Props> = ({ disabled }) => {
  const trackRange = useAtomValue(trackRangeAtom);
  const setTrackRange = useSetAtom(trackRangeAtom);
  const setInvalidRange = useSetAtom(invalidRangeAtom);

  const { isUnlimitedModeActive } = useIsUnlimitedModeActive();
  const shotMaxFrames = useShotMaxFrames();

  const isPlaying = useAtomValue(isPlayingAtom);

  const selectedProjectId = useSelectedProjectId();
  const planMaxFrameRange = usePlanMaxFrameRange();
  const { renderSettingsValuesAtom, selectedModelAtom } =
    useRenderSettingsAtoms();
  const values = useAtomValue(renderSettingsValuesAtom);
  const selectedModel = useAtomValue(selectedModelAtom);
  const { fps } = useFpsForShot();

  const { minFrames, maxFrames } = useRenderDurationLimits();

  const isInterpolationEnabled = !!values?.enable_interpolation;
  const minRangeLength = toRangeLength(minFrames);

  const currentRangeMin = trackRange[0];
  const currentRangeMax = trackRange[1];

  const { control, getValues, setValue } = useForm<FormValues>({
    defaultValues: {
      rangeMin: currentRangeMin.toString(),
      rangeMax: currentRangeMax.toString()
    },
    values: {
      rangeMin: currentRangeMin.toString(),
      rangeMax: currentRangeMax.toString()
    }
  });

  const onRangeChange = useCallback(
    ({ newInputValue, isMin }: { newInputValue: number; isMin: boolean }) => {
      if (!selectedProjectId) return;

      const attemptedRange: [number, number] = isMin
        ? [newInputValue, currentRangeMax]
        : [currentRangeMin, newInputValue];

      const isAttemptedRangeValid = isRangeValid({
        range: attemptedRange,
        shotMaxFrames,
        minFrames: Math.max(minFrames - 1, 0),
        maxFrames: Math.max(maxFrames - 1, 0)
      });

      if (!isAttemptedRangeValid) {
        setInvalidRange(attemptedRange);
      } else {
        setInvalidRange(undefined);
      }

      const { newMin, newMax } = validateRange({
        currentMin: currentRangeMin,
        currentMax: currentRangeMax,
        newValue: newInputValue,
        isNewValueMin: isMin,
        shotMaxFrames,
        isInterpolationEnabled,
        selectedModel,
        planMaxFrameRange,
        isRelaxedEnabled: isUnlimitedModeActive,
        fps
      });

      setValue("rangeMin", newMin.toString());
      setValue("rangeMax", newMax.toString());

      setTrackRange([newMin, newMax]);
    },
    [
      currentRangeMin,
      currentRangeMax,
      selectedProjectId,
      shotMaxFrames,
      setValue,
      setTrackRange,
      setInvalidRange,
      isInterpolationEnabled,
      selectedModel,
      planMaxFrameRange,
      isUnlimitedModeActive,
      fps,
      minFrames,
      maxFrames
    ]
  );

  const parseInputValue = useCallback((value: string) => {
    if (value.trim() === "") {
      return 0;
    }

    const parsedValue = parseInt(value, 10);
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent, isMin: boolean) => {
      if (isPlaying || disabled) return;

      const delta = e.deltaY > 0 ? -1 : 1;
      const currentValue = isMin
        ? parseInputValue(getValues("rangeMin"))
        : parseInputValue(getValues("rangeMax"));
      const newValue = currentValue + delta;

      onRangeChange({ newInputValue: newValue, isMin });
    },
    [isPlaying, disabled, getValues, onRangeChange, parseInputValue]
  );

  return (
    <div className="flex items-center justify-start grow">
      <div className="relative grow min-w-20 max-w-32 shrink-0">
        <Controller
          name="rangeMin"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="range-input-min"
              disabled={isPlaying || disabled}
              endCaption="f"
              max={shotMaxFrames - minRangeLength}
              min={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onRangeChange({
                    newInputValue: parseInputValue(getValues("rangeMin")),
                    isMin: true
                  });
                  e.currentTarget.blur();
                }
              }}
              onFocus={() => {
                trackingWithProjectId.timelineActions.frameRange(
                  "min",
                  selectedProjectId,
                  parseInt(getValues("rangeMin"), 10)
                );
              }}
              onBlur={(e) => {
                const newInputValue = parseInputValue(e.target.value);
                onRangeChange({ newInputValue, isMin: true });
              }}
              onWheel={(e) => handleWheel(e as unknown as WheelEvent, true)}
              type="number"
              aria-label="Frame Range Input Min"
              preserveEmptyWhileFocused
              selectAllTextOnFocus
            />
          )}
        />
      </div>

      <div className="mx-1">
        <Text color="glyph-secondary" component="span">
          —
        </Text>
      </div>

      <div className="relative grow min-w-20 max-w-32 shrink-0">
        <Controller
          name="rangeMax"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="range-input-max"
              disabled={isPlaying || disabled}
              endCaption="f"
              max={shotMaxFrames}
              min={minRangeLength}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onRangeChange({
                    newInputValue: parseInputValue(getValues("rangeMax")),
                    isMin: false
                  });
                  e.currentTarget.blur();
                }
              }}
              onFocus={() => {
                trackingWithProjectId.timelineActions.frameRange(
                  "max",
                  selectedProjectId,
                  parseInt(getValues("rangeMax"), 10)
                );
              }}
              onBlur={(e) => {
                const newInputValue = parseInputValue(e.target.value);
                onRangeChange({ newInputValue, isMin: false });
              }}
              onWheel={(e) => handleWheel(e as unknown as WheelEvent, false)}
              type="number"
              aria-label="Frame Range Input Max"
              preserveEmptyWhileFocused
              selectAllTextOnFocus
            />
          )}
        />
      </div>
    </div>
  );
};
