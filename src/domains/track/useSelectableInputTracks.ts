import { useFilteredAndSortedTracks } from "./useFilteredAndSortedTracks";

export const useSelectableInputTracks = (): string[] => {
  const { data: filteredTracks } = useFilteredAndSortedTracks();

  if (!filteredTracks) return [];

  const allTracks = [
    filteredTracks.videoTrack,
    ...filteredTracks.tracks
  ].filter(Boolean);

  return allTracks.map((t) => t.id);
};
