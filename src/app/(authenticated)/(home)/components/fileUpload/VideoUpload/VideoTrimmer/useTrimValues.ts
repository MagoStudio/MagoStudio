import { useState } from "react";

import {
  adjustTrimOnMinChange,
  adjustTrimOnMaxChange,
  MIN_TRIM_RANGE,
  MAX_TRIM_RANGE
} from "./trimConstraints";

export const useTrimValues = (
  videoDuration: number = 0,
  setCurrentTime: (time: number) => void,
  updateVideoTime: (time: number) => void
) => {
  const [minTrimTime, setMinTrimTime] = useState(0);
  const [maxTrimTime, setMaxTrimTime] = useState(0);

  const [lastVideoDuration, setLastVideoDuration] = useState(videoDuration);
  if (videoDuration !== lastVideoDuration) {
    setLastVideoDuration(videoDuration);
    if (videoDuration > 0) {
      setMaxTrimTime(
        videoDuration < MAX_TRIM_RANGE ? videoDuration : MAX_TRIM_RANGE
      );
    }
  }

  const handleMinTimeChange = (newMin: number) => {
    const adjusted = adjustTrimOnMinChange(newMin, {
      videoDuration,
      currentMin: minTrimTime,
      currentMax: maxTrimTime
    });

    setMaxTrimTime(adjusted.max);
    setMinTrimTime(adjusted.min);
    setCurrentTime(adjusted.min);
    updateVideoTime(adjusted.min);
  };
  const handleMaxTimeChange = (newMax: number) => {
    const adjusted = adjustTrimOnMaxChange(newMax, {
      videoDuration,
      currentMin: minTrimTime,
      currentMax: maxTrimTime
    });

    setMinTrimTime(adjusted.min);
    setMaxTrimTime(adjusted.max);
    setCurrentTime(adjusted.max);
    updateVideoTime(adjusted.max);
  };
  const handleBothTimesChange = (newMin: number, newMax: number) => {
    const clampedMin = Math.max(0, Math.min(videoDuration, newMin));
    const clampedMax = Math.max(0, Math.min(videoDuration, newMax));

    setMinTrimTime(clampedMin);
    setMaxTrimTime(clampedMax);
    setCurrentTime(clampedMin);
    updateVideoTime(clampedMin);
  };
  const minInputMin = 0;
  const minInputMax = Math.floor(
    Math.min(videoDuration - MIN_TRIM_RANGE, videoDuration)
  );
  const maxInputMin = Math.floor(minTrimTime + MIN_TRIM_RANGE);
  const maxInputMax = Math.ceil(
    Math.min(minTrimTime + MAX_TRIM_RANGE, videoDuration)
  );
  return {
    minTrimTime,
    maxTrimTime,
    setMinTrimTime,
    setMaxTrimTime,
    handleMinTimeChange,
    handleMaxTimeChange,
    handleBothTimesChange,
    minInputMin,
    minInputMax,
    maxInputMin,
    maxInputMax
  };
};
