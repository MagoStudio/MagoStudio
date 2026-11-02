const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

const padToTwoDigits = (value: number): string =>
  String(value).padStart(2, "0");

export const formatBulkRendersRunElapsedTime = ({
  startedAt,
  now
}: {
  startedAt: string | null | undefined;
  now: Date;
}): string | undefined => {
  if (!startedAt) return undefined;

  const totalSeconds = Math.max(
    0,
    Math.round((now.getTime() - new Date(startedAt).getTime()) / 1000)
  );
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor(
    (totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE
  );
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  return `${padToTwoDigits(hours)}:${padToTwoDigits(minutes)}:${padToTwoDigits(seconds)}`;
};
