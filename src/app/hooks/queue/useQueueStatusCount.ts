import { useQueueItems } from "./useQueueItems";
import {
  countQueueItemsByStatus,
  NO_QUEUE_STATUS_COUNTS
} from "./utils/countQueueItemsByStatus";

export const useQueueStatusCount = () => {
  const { queueItems, isInitialLoading } = useQueueItems();

  const queueStatusCounts = queueItems
    ? countQueueItemsByStatus(queueItems)
    : NO_QUEUE_STATUS_COUNTS;

  return {
    ...queueStatusCounts,
    isInitialLoading
  };
};
