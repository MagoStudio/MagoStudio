import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useGetTrackById } from "@domains/track/useGetTrackById";
import { getTrackAsset } from "@domains/track/utils/getTrackAsset";
import { useQueue } from "@hooks/queue/useQueue";

import { findMatchingQueueItem } from "./utils/findMatchingQueueItem";

export const useQueueItemForTrack = ({
  trackId,
  shotIdOverride
}: {
  trackId: string | undefined;
  shotIdOverride?: string;
}) => {
  const { data: queue, ...rest } = useQueue();
  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();

  const { data: track } = useGetTrackById({
    trackId,
    selectedProjectId: selectedProjectId,
    selectedShotId: shotIdOverride ?? selectedShotId,
    disabled: !trackId
  });

  const currentQueueItem = findMatchingQueueItem(queue, track);

  const filepath = getTrackAsset(track)?.filepath;

  return {
    data: currentQueueItem,
    filepath,
    ...rest
  };
};
