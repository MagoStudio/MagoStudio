export const deriveImageToVideoFrameRange = (
  durationInSeconds: number,
  fps: number
): [number, number] => {
  return [0, Math.max(Math.round(durationInSeconds * fps) - 1, 0)];
};
