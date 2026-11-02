export const snapToClosestValidBounds = (
  range: [number, number],
  inputTrackOffset: number,
  inputTrackDuration: number
): [number, number] => {
  const [min, max] = range;
  const validMin = inputTrackOffset;
  const validMax = inputTrackOffset + inputTrackDuration;
  const rangeLength = max - min;

  const minOutOfBounds = min < validMin;
  const maxOutOfBounds = max > validMax;

  if (minOutOfBounds) {
    return [validMin, Math.min(validMin + rangeLength, validMax)];
  }

  if (maxOutOfBounds) {
    return [Math.max(validMax - rangeLength, validMin), validMax];
  }

  return range;
};
