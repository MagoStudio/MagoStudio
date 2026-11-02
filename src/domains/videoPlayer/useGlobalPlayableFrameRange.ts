import { useSelectedTracks } from "@domains/track/useSelectedTracks";
import { getSelectedTracksIntersection } from "@utils";
export const useGlobalPlayableFrameRange = () => {
  const { data: selectedTracks } = useSelectedTracks();
  const globalPlayableFrameRange = (() => {
    const range = getSelectedTracksIntersection(selectedTracks);
    return range
      ? {
          start: range[0],
          end: range[1]
        }
      : {
          start: Infinity,
          end: -Infinity
        };
  })();
  return {
    globalPlayableFrameRange
  };
};
