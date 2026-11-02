import { mediaDownloads } from "@domains/asset/mediaDownloads";
import { useSelectedTracks } from "@domains/track/useSelectedTracks";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { getTrackDuration } from "@domains/track/utils/getTrackDuration";
import { Layer } from "@schemas/layer";
import { isAnyVideoLoadingAtom } from "@store/atoms";
import { getSelectedTracksIntersection } from "@utils";
import { useAtomValue } from "jotai";
import { useSyncExternalStore } from "react";
const isRangePlayable = (start: number, end: number): boolean => {
  return end - start > 1;
};

const calculateDisablePlayButton = (selectedLayers: Layer[]): boolean => {
  if (!selectedLayers || selectedLayers.length === 0) {
    return true;
  }

  const range = getSelectedTracksIntersection(selectedLayers);

  if (!range) {
    return true;
  }

  if (!isRangePlayable(range[0], range[1])) {
    return true;
  }

  const hasValidVideoTrack = selectedLayers.some(
    (track) => (getTrackDuration(track) || 0) > 1
  );

  return !hasValidVideoTrack;
};

export const useDisablePlayButton = () => {
  const { data: selectedTracks } = useSelectedTracks();
  const isDownloading = useSyncExternalStore(
    mediaDownloads.subscribe,
    () =>
      selectedTracks.some((track) => {
        const assetId = getTrackAssetId(track);
        const state = assetId
          ? mediaDownloads.getAssetState(assetId)
          : undefined;
        return state === "queued" || state === "downloading";
      }),
    () => false
  );
  const isAnyVideoLoading = useAtomValue(isAnyVideoLoadingAtom);
  const disablePlayButton = (() => {
    const baseDisable = calculateDisablePlayButton(selectedTracks);
    return isDownloading || (baseDisable && !isAnyVideoLoading);
  })();
  return {
    disablePlayButton,
    isDownloading
  };
};
