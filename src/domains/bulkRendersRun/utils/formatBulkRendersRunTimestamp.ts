import dayjs from "dayjs";

export const formatBulkRendersRunTimestamp = (isoTimestamp: string): string =>
  dayjs(isoTimestamp).format("HH:mm DD.MM.YYYY");
