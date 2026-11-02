/** Mirrors the backend's frame-count snapping for the v9 engines. The generator only produces counts on this grid, so asking for
 * anything else silently delivers a different length than the user picked. */
const V9_TEMPORAL_PERIOD = 17;
const V9_TEMPORAL_OFFSET = 5;
const V9_MAX_FRAMES = 3592;

export const SHOT_FPS = 24;

/** Python's `%` always returns a non-negative result; JavaScript's keeps the sign. Snapping with
 * the JS operator rounds DOWN off the grid and asks the engine for a length it cannot make. */
const positiveModulo = (value: number, divisor: number): number =>
  ((value % divisor) + divisor) % divisor;

export const snapShotFrames = (frames: number): number => {
  const wanted = Math.max(1, Math.trunc(frames));
  const snapped =
    wanted +
    positiveModulo(
      V9_TEMPORAL_OFFSET - positiveModulo(wanted, V9_TEMPORAL_PERIOD),
      V9_TEMPORAL_PERIOD
    );

  return Math.min(Math.max(snapped, V9_TEMPORAL_OFFSET), V9_MAX_FRAMES);
};

export const snapShotSecondsToFrames = (seconds: number): number =>
  snapShotFrames(Math.round(seconds * SHOT_FPS));

export const framesToSeconds = (frames: number): number => frames / SHOT_FPS;
