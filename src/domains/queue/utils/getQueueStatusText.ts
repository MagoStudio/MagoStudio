import { type QueueItem } from "@hooks/queue/interface";
import { AssetStatus } from "@schemas/asset";
import { type TFunction } from "i18next";

import { formatETA } from "./formatEta";
import { getInQueueStatusText } from "./getInQueueStatusText";

export const getQueueStatusText = (
  queueItem: QueueItem,
  ETA: number | undefined,
  t: TFunction
) => {
  switch (queueItem.status) {
    case AssetStatus.ERROR:
      return t("status.failed.label");
    case AssetStatus.PENDING:
      return getInQueueStatusText(queueItem.display_order);
    case AssetStatus.INQUEUE:
      if (queueItem.display_order === 0) {
        return t("status.in_queue_next.label");
      }
      return getInQueueStatusText(queueItem.display_order);
    case AssetStatus.PAUSED:
      return t("status.paused.label");
    case AssetStatus.INPROGRESS:
      if (ETA === undefined) {
        return t("status.starting.label");
      }
      if (ETA === 0) {
        return t("status.still_in_progress.label");
      }
      return `${formatETA(ETA)}`;
    case AssetStatus.FINISHED:
      return t("status.done.label");
    case AssetStatus.CANCELLED:
      return t("status.cancelled.label");
    default:
      return "";
  }
};
