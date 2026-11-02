export const clampRangeToShotLength = ({
  rangeMin,
  rangeMax,
  shotMaxFrames
}: {
  rangeMin: number;
  rangeMax: number;
  shotMaxFrames: number;
}): [number, number] | undefined => {
  const isShotLengthUnknown = shotMaxFrames <= 0;

  if (isShotLengthUnknown || rangeMax <= shotMaxFrames) {
    return undefined;
  }

  return [Math.min(rangeMin, shotMaxFrames), shotMaxFrames];
};
