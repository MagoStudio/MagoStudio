const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

export const formatETA = (ETA: number | undefined): string => {
  if (!ETA) return "";

  const ETADate = new Date(ETA);

  const days = Math.floor(
    ETADate.getTime() /
      (MILLISECONDS_PER_SECOND *
        SECONDS_PER_MINUTE *
        MINUTES_PER_HOUR *
        HOURS_PER_DAY)
  );
  const hours = String(ETADate.getUTCHours()).padStart(2, "0");
  const minutes = String(ETADate.getUTCMinutes()).padStart(2, "0");
  const seconds = String(ETADate.getUTCSeconds()).padStart(2, "0");

  return `${days > 0 ? days + "d" : ""} ${hours}:${minutes}:${seconds}`;
};
