import { AssetStatus } from "@schemas/asset";

export interface QueueStatusCounts {
  done: number | undefined;
  error: number | undefined;
  inProgress: number | undefined;
  waiting: number | undefined;
}

export const NO_QUEUE_STATUS_COUNTS: QueueStatusCounts = {
  done: undefined,
  error: undefined,
  inProgress: undefined,
  waiting: undefined
};

export const countQueueItemsByStatus = (
  queueItems: { status: string }[]
): QueueStatusCounts => {
  const counts: QueueStatusCounts = { ...NO_QUEUE_STATUS_COUNTS };

  for (const item of queueItems) {
    if (item.status === AssetStatus.FINISHED) {
      counts.done = (counts.done ?? 0) + 1;
    } else if (item.status === AssetStatus.ERROR) {
      counts.error = (counts.error ?? 0) + 1;
    } else if (item.status === AssetStatus.INPROGRESS) {
      counts.inProgress = (counts.inProgress ?? 0) + 1;
    } else if (
      item.status === AssetStatus.PENDING ||
      item.status === AssetStatus.INQUEUE
    ) {
      counts.waiting = (counts.waiting ?? 0) + 1;
    }
  }

  return counts;
};
