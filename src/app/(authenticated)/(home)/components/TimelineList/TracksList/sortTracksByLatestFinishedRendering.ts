import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { type QueueItem } from "@hooks/queue/interface";
import { Layer } from "@schemas/layer";

export const sortTracksByLatestFinishedRendering = (
  tracks: Layer[],
  queue: QueueItem[] | undefined
) => {
  return tracks.sort((a, b) => {
    const aQueueItem = queue?.find(
      (queueItem) => queueItem.asset_id === getTrackAssetId(a)
    );
    const bQueueItem = queue?.find(
      (queueItem) => queueItem.asset_id === getTrackAssetId(b)
    );

    if (aQueueItem?.finished_at && bQueueItem?.finished_at) {
      return (
        new Date(bQueueItem.finished_at).getTime() -
        new Date(aQueueItem.finished_at).getTime()
      );
    }

    return 0;
  });
};
