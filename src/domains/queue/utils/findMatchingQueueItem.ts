import { getTrackAsset } from "@domains/track/utils/getTrackAsset";
import { type QueueItem } from "@hooks/queue/interface";
import { Layer } from "@schemas/layer";

const readQueueItemAssetIds = (queueItem: QueueItem): string[] =>
  [queueItem.asset_id, queueItem.cloud_asset_id].filter(
    (assetId): assetId is string => !!assetId
  );

export const findMatchingQueueItem = (
  queueItems: QueueItem[] | undefined,
  track: Layer | undefined
): QueueItem | undefined => {
  const clipAsset = getTrackAsset(track);
  if (!clipAsset) return undefined;

  return queueItems?.find((queueItem) => {
    const queueItemAssetIds = readQueueItemAssetIds(queueItem);
    return (
      queueItemAssetIds.includes(clipAsset.id) ||
      queueItemAssetIds.some(
        (assetId) => clipAsset.data?.parent_render === assetId
      )
    );
  });
};
