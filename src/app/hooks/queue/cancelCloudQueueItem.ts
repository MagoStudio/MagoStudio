import { isCloudResourceAlreadyGoneError } from "@domains/cloud/isCloudResourceAlreadyGoneError";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { fetchCloudQueueRowForQueueItem } from "./fetchCloudQueueRowForQueueItem";
import { QueueItem } from "./interface";

const deleteCloudResourceUnlessAlreadyGone = async (url: string) => {
  try {
    await backendApiClient.delete(url);
  } catch (err) {
    if (!isCloudResourceAlreadyGoneError(err)) throw err;
  }
};

export const cancelCloudQueueItem = async ({
  queueItem,
  shouldDeleteCloudOutputLayer
}: {
  queueItem: QueueItem;
  shouldDeleteCloudOutputLayer: boolean;
}): Promise<void> => {
  const cloudQueueRow = await fetchCloudQueueRowForQueueItem(queueItem);
  if (cloudQueueRow?.cloudQueueItemId) {
    await deleteCloudResourceUnlessAlreadyGone(
      `/queue/${cloudQueueRow.cloudQueueItemId}`
    );
  }

  const localCloudRenderJobId = queueItem.local_cloud_render_job_id;
  if (localCloudRenderJobId === undefined) return;

  const cloudOutputLayerId = cloudQueueRow?.cloudOutputLayerId;
  if (shouldDeleteCloudOutputLayer && cloudOutputLayerId) {
    await deleteCloudResourceUnlessAlreadyGone(`/layers/${cloudOutputLayerId}`);
  }
  await getLocalDesktopApi().imageRenders.cancel(localCloudRenderJobId);
};
