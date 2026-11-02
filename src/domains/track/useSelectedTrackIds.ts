import { useGetSelectedTrackIdsFromUrl } from "./data/useGetSelectedTrackIdsFromUrl";
import { useFilteredAndSortedTracks } from "./useFilteredAndSortedTracks";
import { resolveSelectedTrackIds } from "./utils/resolveSelectedTrackIds";

export const useSelectedTrackIds = () => {
  const {
    data: { videoTrack, tracks }
  } = useFilteredAndSortedTracks();
  const trackIdsFromUrl = useGetSelectedTrackIdsFromUrl();

  const selectableTrackIds = [
    videoTrack?.id,
    ...tracks.map((track) => track.id)
  ].filter((trackId): trackId is string => !!trackId);

  return resolveSelectedTrackIds({
    trackIdsFromUrl,
    videoTrackId: videoTrack?.id,
    selectableTrackIds
  });
};
