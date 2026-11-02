import { isRenderCancelable } from "@domains/queue/utils/isRenderCancelable";
import { AssetStatus } from "@schemas/asset";

import { QueueItem } from "../interface";

export const isCloudQueueItemCancelable = (
  queueItem: Pick<
    QueueItem,
    | "status"
    | "display_order"
    | "local_cloud_render_job_id"
    | "cloud_queue_status"
  >
): boolean => {
  const isTrackedByLocalCloudRenderJob =
    queueItem.local_cloud_render_job_id !== undefined;
  const cloudQueueStatus = isTrackedByLocalCloudRenderJob
    ? queueItem.cloud_queue_status
    : queueItem.status;
  if (!cloudQueueStatus) return false;
  return isRenderCancelable({
    status: cloudQueueStatus as AssetStatus,
    positionInQueue: queueItem.display_order
  });
};
