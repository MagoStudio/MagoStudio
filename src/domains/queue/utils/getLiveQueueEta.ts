import { type QueueItem } from "@hooks/queue/interface";
import { AssetStatus } from "@schemas/asset";

const MS_PER_SECOND = 1000;

export const getLiveQueueEta = (
  queueItem: QueueItem | undefined,
  now: number
): number | undefined => {
  if (!queueItem || queueItem.status !== AssetStatus.INPROGRESS) {
    return undefined;
  }
  if (queueItem.estimated_end_time) {
    const estimatedEnd = new Date(queueItem.estimated_end_time).getTime();
    if (Number.isFinite(estimatedEnd)) return Math.max(0, estimatedEnd - now);
  }
  return queueItem.ETA === undefined
    ? undefined
    : Math.max(0, queueItem.ETA * MS_PER_SECOND);
};
