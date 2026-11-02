import { useInputTrack } from "@domains/track/useInputTrack";
import { getTimelineOffset } from "@domains/track/utils/frameCoordinates";
import { getTrackDuration } from "@domains/track/utils/getTrackDuration";
import { VideoModelDefinition, VideoSettings } from "@models/video/types";
import { invalidRangeAtom } from "@store/atoms/trackRangeAtom";
import { useAtom } from "jotai";

import { validateRange } from "../../../TimelineControls/RangeInput/validateRange";

import { isRangeValid } from "./isRangeValid";
import { snapToClosestValidBounds } from "./snapToClosestValidBounds";

interface UseRangeValidationProps {
  trackRange: [number, number];
  shotMaxFrames: number;
  minRangeLength: number;
  maxRangeLength: number;
  isInterpolationEnabled: boolean;
  selectedModel: VideoModelDefinition;
  planMaxFrameRange: number | undefined;
  isUnlimitedModeActive: boolean;
  fps: number;
  settings?: VideoSettings;
}

export type ChangedHandle = "start" | "end";

export interface ValidatedRangeResult {
  range: [number, number];
  changedHandle: ChangedHandle;
}

export const useRangeValidation = (props: UseRangeValidationProps) => {
  const [invalidRange, setInvalidRange] = useAtom(invalidRangeAtom);

  const { inputTrack } = useInputTrack();

  const inputTrackOffset = getTimelineOffset(inputTrack);
  const inputTrackDuration = getTrackDuration(inputTrack) || 0;
  const validateAndSetRange = (
    newValue: number[],
    isMouseDown: boolean,
    onRangeChange: (range: [number, number]) => void,
    onFrameChange?: (frame: number) => void,
    changedHandle?: ChangedHandle
  ): ValidatedRangeResult | null => {
    const {
      trackRange: [rangeMinFr, rangeMaxFr],
      minRangeLength,
      maxRangeLength,
      shotMaxFrames,
      isInterpolationEnabled,
      selectedModel,
      planMaxFrameRange,
      isUnlimitedModeActive,
      fps
    } = props;

    let attemptedRange: [number, number] = [newValue[0], newValue[1]];

    const isOutOfBounds =
      attemptedRange[0] < inputTrackOffset ||
      attemptedRange[1] > inputTrackOffset + inputTrackDuration;

    if (!isMouseDown && inputTrackDuration > 0 && isOutOfBounds) {
      const snappedRange = snapToClosestValidBounds(
        attemptedRange,
        inputTrackOffset,
        inputTrackDuration
      );
      const detectedHandle: ChangedHandle =
        changedHandle ?? (rangeMinFr !== snappedRange[0] ? "start" : "end");
      onRangeChange(snappedRange);
      if (onFrameChange) {
        onFrameChange(
          detectedHandle === "start" ? snappedRange[0] : snappedRange[1]
        );
      }
      setInvalidRange(undefined);
      return {
        range: snappedRange,
        changedHandle: detectedHandle
      };
    }

    const isValid = isRangeValid({
      range: attemptedRange,
      shotMaxFrames,
      minFrames: minRangeLength,
      maxFrames: maxRangeLength
    });

    setInvalidRange(isValid ? undefined : attemptedRange);

    const isChangingStart = changedHandle === "start";

    if (!isChangingStart) {
      const newRangeLength = attemptedRange[1] - rangeMinFr;

      if (newRangeLength < minRangeLength) {
        const clampedMax = rangeMinFr + minRangeLength;
        if (rangeMaxFr === clampedMax) return null;
        onRangeChange([rangeMinFr, clampedMax]);
        if (onFrameChange) {
          onFrameChange(clampedMax);
        }
        return {
          range: [rangeMinFr, clampedMax],
          changedHandle: "end"
        };
      }

      if (newRangeLength > maxRangeLength) {
        const currentRangeLength = rangeMaxFr - rangeMinFr;
        if (currentRangeLength < maxRangeLength) {
          const clampedMax = rangeMinFr + maxRangeLength;
          onRangeChange([rangeMinFr, clampedMax]);
          if (onFrameChange) {
            onFrameChange(clampedMax);
          }
          return {
            range: [rangeMinFr, clampedMax],
            changedHandle: "end"
          };
        }
        return null;
      }
      const finalMax = Math.min(
        attemptedRange[1],
        rangeMinFr + maxRangeLength,
        shotMaxFrames
      );

      onRangeChange([rangeMinFr, finalMax]);
      if (onFrameChange) {
        onFrameChange(finalMax);
      }
      return {
        range: [rangeMinFr, finalMax],
        changedHandle: "end"
      };
    }

    const validated = validateRange({
      currentMin: rangeMinFr,
      currentMax: rangeMaxFr,
      newValue: attemptedRange[0],
      isNewValueMin: true,
      shotMaxFrames,
      isInterpolationEnabled,
      selectedModel,
      planMaxFrameRange,
      isRelaxedEnabled: isUnlimitedModeActive,
      fps
    });

    onRangeChange([validated.newMin, validated.newMax]);
    if (onFrameChange) {
      onFrameChange(validated.newMin);
    }
    return {
      range: [validated.newMin, validated.newMax],
      changedHandle: "start"
    };
  };
  return {
    invalidRange,
    validateAndSetRange
  };
};
