import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export const formatTimestamp = (timestamp?: string | Date): string => {
  if (!timestamp) return "";

  try {
    const timezone = dayjs.tz.guess();
    const dateInLocalTimezone = dayjs(timestamp).tz(timezone);

    return `${dateInLocalTimezone.format("YYYY-MM-DD")}\u00A0\u00A0${dateInLocalTimezone.format("HH:mm:ss")}`;
  } catch {
    return "";
  }
};
