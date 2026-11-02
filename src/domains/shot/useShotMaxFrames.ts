import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { getTrackDuration } from "@domains/track/utils/getTrackDuration";

const DEFAULT_SHOT_MAX_FRAMES = 0;

export const useShotMaxFrames = () => {
  const { data } = useFilteredAndSortedTracks();
  return getTrackDuration(data.videoTrack) || DEFAULT_SHOT_MAX_FRAMES;
};
