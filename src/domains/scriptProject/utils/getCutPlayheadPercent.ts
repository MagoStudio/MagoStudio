const FULL_TRACK_PERCENT = 100;

export const getCutPlayheadPercent = (
  globalFrame: number,
  totalDurationFrames: number
): number => {
  if (totalDurationFrames <= 0) return 0;

  const ratio = globalFrame / totalDurationFrames;
  return Math.min(FULL_TRACK_PERCENT, Math.max(0, ratio * FULL_TRACK_PERCENT));
};
