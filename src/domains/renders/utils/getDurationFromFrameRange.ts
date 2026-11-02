export const getDurationFromFrameRange = (
  frameRange: number[] | [number, number],
  fps: number
): number => {
  return (frameRange[1] - frameRange[0] + 1) / fps;
};
