import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { type QueueItem } from "@hooks/queue/interface";
import { AssetStatus } from "@schemas/asset";
import { Layer } from "@schemas/layer";

import { sortTracksByLatestFinishedRendering } from "./sortTracksByLatestFinishedRendering";

export const getTrackIdWithDoneStatus = (
  tracks: Layer[],
  queue: QueueItem[] | undefined
) => {
  if (tracks.length === 0) {
    return undefined;
  }

  if (!queue) {
    return undefined;
  }

  const tracksWithDoneStatus = tracks.filter((track) => {
    const queueItem = queue?.find(
      (queueItem) => queueItem.asset_id === getTrackAssetId(track)
    );
    return !!(queueItem?.status === AssetStatus.FINISHED);
  });

  if (tracksWithDoneStatus.length === 0) {
    return undefined;
  }

  const tracksSortedByLatestFinished = sortTracksByLatestFinishedRendering(
    tracksWithDoneStatus,
    queue
  );

  if (
    tracksSortedByLatestFinished[0].data
      .hasBeenInteractedWithSinceRenderFinished
  ) {
    return undefined;
  }

  return tracksSortedByLatestFinished[0].id;
};
