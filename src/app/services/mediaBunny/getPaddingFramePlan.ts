export interface PaddingFramePlan {
  totalFrames: number;
  sourceFrameCount: number;
}

export const getPaddingFramePlan = (
  durationSeconds: number,
  fps: number,
  minSeconds: number
): PaddingFramePlan => {
  const totalFrames = Math.round(minSeconds * fps);
  const sourceFrameCount = Math.min(
    totalFrames,
    Math.ceil(durationSeconds * fps)
  );
  return { totalFrames, sourceFrameCount };
};
