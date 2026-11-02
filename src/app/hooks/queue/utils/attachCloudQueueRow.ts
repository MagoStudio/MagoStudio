import { QueueItem } from "../interface";

import { CloudQueueRow } from "./findCloudQueueRowForAsset";

export const attachCloudQueueRow = (
  localQueueItem: QueueItem,
  cloudQueueRow: CloudQueueRow | null
): QueueItem => {
  const cloudQueueEtaSeconds = cloudQueueRow?.cloudQueueEtaSeconds ?? null;
  return {
    ...localQueueItem,
    cloud_queue_item_id: cloudQueueRow?.cloudQueueItemId ?? null,
    cloud_queue_status: cloudQueueRow?.cloudQueueStatus ?? null,
    cloud_output_layer_id:
      cloudQueueRow?.cloudOutputLayerId ??
      localQueueItem.cloud_output_layer_id ??
      null,
    price: cloudQueueRow?.cloudQueuePrice ?? localQueueItem.price,
    ...(cloudQueueEtaSeconds === null ? {} : { ETA: cloudQueueEtaSeconds })
  };
};
