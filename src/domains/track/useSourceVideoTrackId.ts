import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { useInputTrackIdAtom } from "@store/atoms";
import { useAtomValue } from "jotai";

export const useSourceVideoTrackId = (): string | undefined => {
  const {
    data: { videoTrack }
  } = useFilteredAndSortedTracks();
  const inputTrackIdAtom = useInputTrackIdAtom();
  const inputTrackId = useAtomValue(inputTrackIdAtom);

  return inputTrackId || videoTrack?.id;
};
