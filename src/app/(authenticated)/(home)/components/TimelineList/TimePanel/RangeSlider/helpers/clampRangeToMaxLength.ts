export const clampRangeToMaxLength = ({
  rangeMin,
  rangeMax,
  maxRangeLength,
  shotMaxFrames
}: {
  rangeMin: number;
  rangeMax: number;
  maxRangeLength: number;
  shotMaxFrames: number;
}): [number, number] | undefined => {
  const isRangeWithinMaxLength = rangeMax - rangeMin <= maxRangeLength;

  if (isRangeWithinMaxLength) {
    return undefined;
  }

  const shortenedMax = Math.min(rangeMin + maxRangeLength, shotMaxFrames);

  return rangeMax === shortenedMax ? undefined : [rangeMin, shortenedMax];
};
