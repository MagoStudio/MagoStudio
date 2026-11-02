import { backendApiClient } from "@/lib/backend-api-client";

import { QueueItem } from "./interface";
import {
  CloudQueueRow,
  findCloudQueueRowForAsset
} from "./utils/findCloudQueueRowForAsset";

export const fetchCloudQueueRowForQueueItem = async (
  queueItem: QueueItem
): Promise<CloudQueueRow | null> => {
  const isTrackedByLocalCloudRenderJob =
    queueItem.local_cloud_render_job_id !== undefined;
  if (!isTrackedByLocalCloudRenderJob) {
    return {
      cloudQueueItemId: queueItem.id,
      cloudQueueStatus: queueItem.status,
      cloudOutputLayerId: queueItem.layer_id,
      cloudQueuePrice: queueItem.price,
      cloudQueueEtaSeconds: queueItem.ETA ?? null
    };
  }
  if (queueItem.cloud_queue_item_id) {
    return {
      cloudQueueItemId: queueItem.cloud_queue_item_id,
      cloudQueueStatus: queueItem.cloud_queue_status ?? null,
      cloudOutputLayerId: queueItem.cloud_output_layer_id ?? null,
      cloudQueuePrice: queueItem.price,
      cloudQueueEtaSeconds: queueItem.ETA ?? null
    };
  }
  const cloudQueueRow = queueItem.cloud_asset_id
    ? findCloudQueueRowForAsset(
        (await backendApiClient.get<unknown>("/queue")).data,
        queueItem.cloud_asset_id
      )
    : null;
  if (cloudQueueRow) return cloudQueueRow;
  if (!queueItem.cloud_output_layer_id) return null;
  return {
    cloudQueueItemId: null,
    cloudQueueStatus: null,
    cloudOutputLayerId: queueItem.cloud_output_layer_id,
    cloudQueuePrice: null,
    cloudQueueEtaSeconds: null
  };
};
