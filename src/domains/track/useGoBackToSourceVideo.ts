import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { useSetSelectedTrackIds } from "@domains/track/useSetSelectedTrackIds";
import { useInputTrackIdAtom } from "@store/atoms";
import { useSetAtom } from "jotai";

/**
 * Resets both the input track and the timeline selection back to the project's
 * base video track. Shared by the input-track selector and the input-track
 * timeline row — on the Mask tab that row can be swapped to show a render, so
 * "go back to source" must target the project's base video track, never the
 * currently-displayed track.
 */
export const useGoBackToSourceVideo = () => {
  const { data: filteredTracks } = useFilteredAndSortedTracks();
  const baseVideoTrack = filteredTracks?.videoTrack;

  const inputTrackIdAtom = useInputTrackIdAtom();
  const setInputTrackId = useSetAtom(inputTrackIdAtom);
  const setSelectedTrackIds = useSetSelectedTrackIds();

  return () => {
    if (!baseVideoTrack?.id) {
      return;
    }
    setInputTrackId(baseVideoTrack.id);
    setSelectedTrackIds([baseVideoTrack.id]);
  };
};
