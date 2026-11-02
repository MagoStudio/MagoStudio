/** The `frame_range` a run of `shotFrames` frames asks for.
 *
 * Both ends are inclusive, so N frames end at N-1. This is the same arithmetic
 * the backend applies to a shot's own `duration_s` server-side; sending `[0, N]` asked for one frame more than
 * the length the panel displays, and disagreed with every per-shot override. */
export const buildShotFrameRange = (shotFrames: number): [number, number] => [
  0,
  Math.max(0, shotFrames - 1)
];
