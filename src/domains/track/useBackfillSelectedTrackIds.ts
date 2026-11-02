import { useEffect } from "react";

import { useGetSelectedTrackIdsFromUrl } from "./data/useGetSelectedTrackIdsFromUrl";
import { useFilteredAndSortedTracks } from "./useFilteredAndSortedTracks";
import { useSetSelectedTrackIdsFromUrl } from "./useSelectedTrackIdsFromUrl";

export const useBackfillSelectedTrackIds = () => {
  const trackIdsFromUrl = useGetSelectedTrackIdsFromUrl();
  const setSelectedTrackIdsFromUrl = useSetSelectedTrackIdsFromUrl();
  const {
    data: { videoTrack }
  } = useFilteredAndSortedTracks();

  const videoTrackId = videoTrack?.id;
  const shouldBackfillVideoTrack =
    trackIdsFromUrl.length === 0 && !!videoTrackId;

  // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler -- external sync: persists the resolved default selection into the URL so a reload or shared link reproduces it
  useEffect(() => {
    if (!shouldBackfillVideoTrack) {
      return;
    }
    setSelectedTrackIdsFromUrl([videoTrackId]);
  }, [shouldBackfillVideoTrack, videoTrackId, setSelectedTrackIdsFromUrl]);
};
