export const isRangeValid = ({
  range,
  shotMaxFrames,
  minFrames,
  maxFrames
}: {
  range: [number, number];
  shotMaxFrames: number;
  minFrames: number;
  maxFrames: number;
}): boolean => {
  const rangeLength = range[1] - range[0];

  if (range[1] > shotMaxFrames) {
    return false;
  }

  if (rangeLength > maxFrames) {
    return false;
  }

  if (rangeLength < minFrames) {
    return false;
  }

  return true;
};
