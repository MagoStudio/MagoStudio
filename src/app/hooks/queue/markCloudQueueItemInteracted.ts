import { isCloudResourceAlreadyGoneError } from "@domains/cloud/isCloudResourceAlreadyGoneError";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { fetchCloudQueueRowForQueueItem } from "./fetchCloudQueueRowForQueueItem";
import { QueueItem } from "./interface";

export const markCloudQueueItemInteracted = async (
  queueItem: QueueItem
): Promise<void> => {
  const localCloudRenderJobId = queueItem.local_cloud_render_job_id;
  if (localCloudRenderJobId !== undefined) {
    await getLocalDesktopApi().imageRenders.markInteracted(
      localCloudRenderJobId
    );
  }

  const cloudQueueRow = await fetchCloudQueueRowForQueueItem(queueItem);
  if (!cloudQueueRow?.cloudQueueItemId) return;
  try {
    await backendApiClient.put(
      `/queue/interaction/${cloudQueueRow.cloudQueueItemId}`
    );
  } catch (err) {
    if (!isCloudResourceAlreadyGoneError(err)) throw err;
  }
};
