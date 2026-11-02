import dayjs from "dayjs";
import "dayjs/locale/en";

export const formatSubscriptionDate = (timestamp: number): string => {
  return dayjs.unix(timestamp).locale("en").format("D MMMM YYYY");
};
