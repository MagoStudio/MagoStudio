import { QueueItem } from "@hooks/queue/interface";
import { Asset } from "@schemas/asset";

export const resolveTrackRenderErrorMessage = ({
  assetError,
  queueItem
}: {
  assetError: Asset["data"]["error"] | undefined;
  queueItem: QueueItem | undefined;
}): string | undefined =>
  assetError?.error ||
  assetError?.details?.error ||
  assetError?.message ||
  queueItem?.error?.error_message;
