const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

export const formatMinutesAndSeconds = (durationMs: number): string => {
  const totalSeconds = Math.max(
    0,
    Math.floor(durationMs / MILLISECONDS_PER_SECOND)
  );
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = String(totalSeconds % SECONDS_PER_MINUTE).padStart(2, "0");
  return `${minutes}:${seconds}`;
};
