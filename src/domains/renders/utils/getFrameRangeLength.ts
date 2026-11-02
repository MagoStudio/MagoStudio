export function getFrameRangeLength(frameRange: number[] | undefined) {
  if (frameRange) {
    const diff = frameRange[1] - frameRange[0];
    return Math.max(diff + 1, 1);
  }
  return 1;
}
