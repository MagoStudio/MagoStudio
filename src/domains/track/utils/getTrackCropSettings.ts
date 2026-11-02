import { AbsoluteCropRect } from "@domains/renders/utils/cropRect";
import { Layer } from "@schemas/layer";

import { getTrackClip } from "./getTrackClip";

export interface TrackCropSettings {
  cropCoordinates: AbsoluteCropRect;
  sourceVideoDimensions: [number, number];
}

export const getTrackCropSettings = (
  track: Layer | undefined
): TrackCropSettings | undefined => {
  const clipData = getTrackClip(track)?.data;
  const storedCropCoordinates = clipData?.crop_coordinates;
  const sourceVideoDimensions = clipData?.source_video_dimensions;

  if (!storedCropCoordinates || !sourceVideoDimensions) return undefined;

  return {
    cropCoordinates: {
      topLeft: storedCropCoordinates.top_left,
      bottomRight: storedCropCoordinates.bottom_right
    },
    sourceVideoDimensions
  };
};
