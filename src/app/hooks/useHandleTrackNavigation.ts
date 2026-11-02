import { useFilteredAndSortedTracks } from "@/domains/track/useFilteredAndSortedTracks";
import { useSelectedTrackIds } from "@/domains/track/useSelectedTrackIds";
import { useSetSelectedTrackIds } from "@/domains/track/useSetSelectedTrackIds";

export const useHandleTrackNavigation = () => {
  const {
    data: { videoTrack, tracks }
  } = useFilteredAndSortedTracks();
  const selectedTrackIds = useSelectedTrackIds();
  const setSelectedTrackIds = useSetSelectedTrackIds();

  const handleTrackNavigation = (direction: "up" | "down") => {
    const sortedTracks = [videoTrack, ...tracks].filter(Boolean);
    if (sortedTracks.length <= 1) return;

    if (selectedTrackIds.length === 0 || !selectedTrackIds) {
      setSelectedTrackIds([sortedTracks[0].id]);
      return;
    }

    const sortedSelectedLayers = sortedTracks.filter((layer) =>
      selectedTrackIds.includes(layer.id)
    );

    let newIndex;
    if (direction === "up") {
      const currentLayerId = sortedSelectedLayers[0].id;
      const currentIndex = sortedTracks.findIndex(
        (layer) => layer.id === currentLayerId
      );

      if (currentIndex === -1) return;
      newIndex = Math.max(currentIndex - 1, 0);
    } else {
      const currentLayerId =
        sortedSelectedLayers[sortedSelectedLayers.length - 1].id;
      const currentIndex = sortedTracks.findIndex(
        (layer) => layer.id === currentLayerId
      );
      if (currentIndex === -1) return;
      newIndex = Math.min(currentIndex + 1, sortedTracks.length - 1);
    }

    setSelectedTrackIds([sortedTracks[newIndex].id]);
  };

  return handleTrackNavigation;
};
