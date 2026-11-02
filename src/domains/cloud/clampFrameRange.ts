/**
 * Keeps a render's frame range inside the source it renders from.
 *
 * The local renderers tolerate a range that runs past the last frame; the cloud
 * renderer rejects it, and does so about a second after starting with nothing
 * recorded about why. Observed on staging: a 75-frame source (frames 0..74)
 * submitted with `frame_range: [0, 75]` failed immediately.
 *
 * Clamping rather than refusing is deliberate. The frames beyond the end do not
 * exist, so there is nothing the user could have meant by them, and failing the
 * submit would be worse than rendering the frames they do have.
 */

export interface ClampedFrameRange {
  range: [number, number];
  /** True when the requested range had to be shortened. */
  clamped: boolean;
}

export const clampFrameRange = (
  requested: readonly [number, number],
  frameCount: number | null | undefined
): ClampedFrameRange => {
  const start = Math.max(0, Math.floor(requested[0]));
  const end = Math.floor(requested[1]);

  // Without a frame count there is nothing to clamp against; passing the range
  // through unchanged is better than guessing at a limit.
  if (
    typeof frameCount !== "number" ||
    !Number.isFinite(frameCount) ||
    frameCount <= 0
  ) {
    return { range: [start, Math.max(start, end)], clamped: false };
  }

  const lastFrame = frameCount - 1;
  // Clamp the start into the source first, then bring the end up to meet it, so
  // an inverted or out-of-range request keeps the frame the user asked to start
  // from rather than jumping to wherever the bad end pointed.
  const clampedStart = Math.min(start, lastFrame);
  const clampedEnd = Math.max(clampedStart, Math.min(end, lastFrame));
  return {
    range: [clampedStart, clampedEnd],
    clamped: clampedStart !== start || clampedEnd !== end
  };
};
