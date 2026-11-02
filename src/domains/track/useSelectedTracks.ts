import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";

import { useGetTracksById } from "./data/useGetTracksById";
import { useSelectedTrackIds } from "./useSelectedTrackIds";

export const useSelectedTracks = () => {
  const selectedTrackIds = useSelectedTrackIds();
  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();

  return useGetTracksById({
    trackIds: selectedTrackIds,
    selectedProjectId,
    selectedShotId
  });
};
