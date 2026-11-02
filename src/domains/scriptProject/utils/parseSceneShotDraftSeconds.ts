export const parseSceneShotDraftSeconds = (
  durationSeconds: string
): number | undefined => {
  const trimmedDurationSeconds = durationSeconds.trim();
  if (!trimmedDurationSeconds) return undefined;
  const seconds = Number(trimmedDurationSeconds);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
};
