import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { getFilteredAndSortedLayers } from "@utils";

import { useGetCurrentShotTrackIds } from "@/domains/track/data/useGetCurrentShotTrackIds";
import { useGetTracksById } from "@/domains/track/data/useGetTracksById";

export const useFilteredAndSortedTracks = () => {
  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();

  const { data: shotTrackIds, ...rest } = useGetCurrentShotTrackIds({
    selectedProjectId,
    selectedShotId
  });

  const { data: shotTracks } = useGetTracksById({
    trackIds: shotTrackIds || [],
    selectedProjectId,
    selectedShotId
  });

  const filteredAndSortedTracks = getFilteredAndSortedLayers(shotTracks);
  const data = {
    videoTrack: filteredAndSortedTracks[0],
    tracks: filteredAndSortedTracks.slice(1) || []
  };
  return {
    data,
    ...rest
  };
};
