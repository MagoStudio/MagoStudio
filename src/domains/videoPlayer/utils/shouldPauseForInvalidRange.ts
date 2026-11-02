import { getTrackDuration } from "@domains/track/utils/getTrackDuration";
import { Layer } from "@schemas/layer";
import { getSelectedTracksIntersection } from "@utils";

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

export const shouldPauseForInvalidRange = (
  selectedLayers: Layer[],
  globalPlayableFrameRange: { start: number; end: number }
): boolean => {
  if (calculateDisablePlayButton(selectedLayers)) {
    return true;
  }

  if (
    globalPlayableFrameRange.start === Infinity ||
    globalPlayableFrameRange.end === -Infinity
  ) {
    return true;
  }

  if (
    !isRangePlayable(
      globalPlayableFrameRange.start,
      globalPlayableFrameRange.end
    )
  ) {
    return true;
  }

  return false;
};
