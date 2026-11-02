interface ComputeRedirectDelayArgs {
  elapsedMs: number;
  minBeatMs: number;
}

export const computeRedirectDelay = ({
  elapsedMs,
  minBeatMs
}: ComputeRedirectDelayArgs): number => {
  const clampedElapsedMs = Math.max(0, elapsedMs);
  return Math.max(0, minBeatMs - clampedElapsedMs);
};
