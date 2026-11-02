import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { trackingWithProjectId } from "@hooks/tracking/trackingUtils";
import { useClearCrop } from "@store/cropStore";

import { useSetSelectedTrackIdsFromUrl } from "./data/useGetSelectedTrackIdsFromUrl";

export const useSetSelectedTrackIds = () => {
  const setSelectedTrackIdsFromUrl = useSetSelectedTrackIdsFromUrl();
  const selectedProjectId = useSelectedProjectId();
  const clearCrop = useClearCrop();
  const setSelectedTrackIds = (trackIds: string[]) => {
    setSelectedTrackIdsFromUrl(trackIds);

    if (trackIds.length > 1) {
      clearCrop();
    }

    if (trackIds.length < 2) {
      return;
    }

    if (trackIds.length === 2 && selectedProjectId) {
      trackingWithProjectId.viewportActions.sideBySideTwoTracks(
        selectedProjectId
      );
      return;
    }

    trackingWithProjectId.viewportActions.sideBySideManyTracks(
      selectedProjectId || "",
      trackIds.length
    );
  };
  return setSelectedTrackIds;
};
