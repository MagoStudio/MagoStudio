import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { useSelectableInputTracks } from "@domains/track/useSelectableInputTracks";
import { useSelectedTrackIds } from "@domains/track/useSelectedTrackIds";
import { getTrackInputVideoId } from "@domains/track/utils/getTrackInputVideoId";
import { isMaskTrack } from "@domains/track/utils/isMaskTrack";
import { useInputTrackIdAtom } from "@store/atoms";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";

export const useInitializeInputTrackId = () => {
  const { data: filteredTracks } = useFilteredAndSortedTracks();
  const baseVideoTrack = filteredTracks?.videoTrack;
  const selectedTrackIds = useSelectedTrackIds();

  const inputTrackIdAtom = useInputTrackIdAtom();
  const inputTrackId = useAtomValue(inputTrackIdAtom);
  const setInputTrackId = useSetAtom(inputTrackIdAtom);

  const selectableInputTrackIds = useSelectableInputTracks();
  const isInputTrackAvailable =
    !!inputTrackId && selectableInputTrackIds.includes(inputTrackId);

  const selectedMaskTrack = filteredTracks?.tracks.find(
    (track) => selectedTrackIds.includes(track.id) && isMaskTrack(track)
  );
  const defaultInputTrackId =
    getTrackInputVideoId(selectedMaskTrack) ?? baseVideoTrack?.id;

  const lastInitializedInputTrackIdAtom = useRef<
    typeof inputTrackIdAtom | undefined
  >(undefined);

  // oxlint-disable-next-line custom-react/no-use-effect -- external sync: seeds the in-memory inputTrackIdAtom, which other surfaces also write, once the shot's tracks have loaded
  useEffect(() => {
    if (!defaultInputTrackId) {
      return;
    }

    const isEnteringShot =
      lastInitializedInputTrackIdAtom.current !== inputTrackIdAtom;

    if (isEnteringShot) {
      lastInitializedInputTrackIdAtom.current = inputTrackIdAtom;
      setInputTrackId(defaultInputTrackId);
      return;
    }

    if (!isInputTrackAvailable) {
      setInputTrackId(defaultInputTrackId);
    }
  }, [
    defaultInputTrackId,
    inputTrackIdAtom,
    isInputTrackAvailable,
    setInputTrackId
  ]);
};
