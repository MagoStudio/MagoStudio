export const clampRangeToMinLength = ({
  rangeMin,
  rangeMax,
  minRangeLength,
  shotMaxFrames
}: {
  rangeMin: number;
  rangeMax: number;
  minRangeLength: number;
  shotMaxFrames: number;
}): [number, number] | undefined => {
  const isRangeLongEnough = rangeMax - rangeMin >= minRangeLength;

  if (isRangeLongEnough) {
    return undefined;
  }

  const extendedMax = rangeMin + minRangeLength;

  if (extendedMax <= shotMaxFrames) {
    return rangeMax === extendedMax ? undefined : [rangeMin, extendedMax];
  }

  const shiftedMin = Math.max(0, shotMaxFrames - minRangeLength);
  const isAlreadyShifted =
    rangeMin === shiftedMin && rangeMax === shotMaxFrames;

  return isAlreadyShifted ? undefined : [shiftedMin, shotMaxFrames];
};
