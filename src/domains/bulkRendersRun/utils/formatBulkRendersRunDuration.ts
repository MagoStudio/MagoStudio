const SECONDS_PER_MINUTE = 60;

const padToTwoDigits = (value: number): string =>
  String(value).padStart(2, "0");

export const formatBulkRendersRunDuration = ({
  startedAt,
  finishedAt
}: {
  startedAt: string | null | undefined;
  finishedAt: string | null | undefined;
}): string | undefined => {
  if (!startedAt || !finishedAt) return undefined;

  const totalSeconds = Math.max(
    0,
    Math.round(
      (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000
    )
  );
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  return `${minutes}m ${padToTwoDigits(seconds)}s`;
};
