export const getJoinedTimestampOffsets = (
  clipSpansInSeconds: number[]
): number[] => {
  const offsets: number[] = [];
  let runningSpan = 0;
  for (const span of clipSpansInSeconds) {
    offsets.push(runningSpan);
    runningSpan += span;
  }
  return offsets;
};
