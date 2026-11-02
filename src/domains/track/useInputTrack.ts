import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useInputTrackIdAtom } from "@store/atoms";
import { useAtomValue } from "jotai";

import { useGetTrackById } from "./data/useGetTrackById";

export const useInputTrack = () => {
  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();
  const inputTrackIdAtom = useInputTrackIdAtom();
  const inputTrackId = useAtomValue(inputTrackIdAtom);

  const { data: inputTrack, isLoading } = useGetTrackById({
    trackId: inputTrackId,
    selectedProjectId,
    selectedShotId,
    disabled: !inputTrackId
  });

  return {
    inputTrack,
    isLoading
  };
};
