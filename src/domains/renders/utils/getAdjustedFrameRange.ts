import { toRangeLength } from "./frameDurationLimits";

export const getAdjustedFrameRange = ({
  trackRange,
  shotMaxFrames,
  minFrames,
  isInterpolationEnabled
}: {
  trackRange: [number, number];
  shotMaxFrames: number;
  minFrames: number;
  isInterpolationEnabled: boolean;
}): [number, number] => {
  const constrainedRange: [number, number] = [
    Math.min(trackRange[0], shotMaxFrames),
    Math.min(trackRange[1], shotMaxFrames)
  ];

  const minRangeLength = toRangeLength(minFrames);

  if (
    isInterpolationEnabled &&
    constrainedRange[1] - constrainedRange[0] < minRangeLength
  ) {
    const expandedEnd = constrainedRange[0] + minRangeLength;
    if (expandedEnd <= shotMaxFrames) {
      return [constrainedRange[0], expandedEnd];
    }
    const expandedStart = Math.max(0, shotMaxFrames - minRangeLength);
    return [expandedStart, shotMaxFrames];
  }

  return constrainedRange;
};
