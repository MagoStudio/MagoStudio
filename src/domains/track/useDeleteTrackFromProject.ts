import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useDeleteTrack } from "@domains/track/data/useDeleteTrack";
import { QueueItem } from "@hooks/queue/interface";
import { useDeleteQueueItem } from "@hooks/queue/useDeleteQueueItem";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { Layer } from "@schemas/layer";

import { useFilteredAndSortedTracks } from "./useFilteredAndSortedTracks";
import { useSetSelectedTrackIds } from "./useSetSelectedTrackIds";
import { getTrackClip } from "./utils/getTrackClip";

export const useDeleteTrackFromProject = () => {
  const { mutateAsync: deleteTrack, isPending: deleteTrackIsPending } =
    useDeleteTrack();
  const { mutateAsync: deleteQueueItem, isPending: deleteQueueItemIsPending } =
    useDeleteQueueItem();

  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();
  const setSelectedTrackIds = useSetSelectedTrackIds();
  const {
    data: { videoTrack }
  } = useFilteredAndSortedTracks();
  const handleDeleteTrack = async (
    trackToDelete: Layer,
    queue: QueueItem[] | undefined
  ) => {
    const clip = getTrackClip(trackToDelete);
    const queueItem = queue?.find(
      (queueItem: QueueItem) =>
        clip?.asset.id === queueItem.asset_id ||
        clip?.asset?.data?.parent_render === queueItem.asset_id
    );

    if (queueItem) {
      await deleteQueueItem({
        queueItemId: queueItem.id,
        shouldDeleteCloudOutputLayer: true
      });
    }

    await deleteTrack({
      trackId: trackToDelete.id,
      shotId: selectedShotId,
      projectId: selectedProjectId
    });

    setSelectedTrackIds(videoTrack ? [videoTrack.id] : []);

    trackingUtils.trackActions.delete(
      trackToDelete.id,
      trackToDelete.timeline_id,
      trackToDelete.user_id
    );
  };
  return {
    handleDeleteTrack,
    isPending: deleteTrackIsPending || deleteQueueItemIsPending
  };
};
