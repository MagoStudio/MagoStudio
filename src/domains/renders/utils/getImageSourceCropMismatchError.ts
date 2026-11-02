import { SourceImage } from "@domains/renders/types";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import {
  getTrackCropSettings,
  TrackCropSettings
} from "@domains/track/utils/getTrackCropSettings";
import { Layer } from "@schemas/layer";

import {
  isShotCroppedSectionOfInputVideo,
  NormalizedCropRect,
  toAbsoluteCropRect
} from "./cropRect";

const isAbsoluteCropEqual = (
  a: { topLeft: [number, number]; bottomRight: [number, number] },
  b: { topLeft: [number, number]; bottomRight: [number, number] }
): boolean =>
  a.topLeft[0] === b.topLeft[0] &&
  a.topLeft[1] === b.topLeft[1] &&
  a.bottomRight[0] === b.bottomRight[0] &&
  a.bottomRight[1] === b.bottomRight[1];

const getSourceCropSettings = (
  source: SourceImage,
  tracks: Layer[]
): TrackCropSettings | undefined => {
  if (source.crop_coordinates && source.source_video_dimensions) {
    return {
      cropCoordinates: {
        topLeft: source.crop_coordinates.top_left,
        bottomRight: source.crop_coordinates.bottom_right
      },
      sourceVideoDimensions: source.source_video_dimensions
    };
  }

  const originatingTrack = tracks.find(
    (track) => getTrackAssetId(track) === source.asset_id
  );
  return getTrackCropSettings(originatingTrack);
};

export const getImageSourceCropMismatchError = ({
  crop,
  inputVideoWidth,
  inputVideoHeight,
  sources,
  tracks
}: {
  crop: NormalizedCropRect | undefined;
  inputVideoWidth: number | undefined;
  inputVideoHeight: number | undefined;
  sources: SourceImage[];
  tracks: Layer[];
}): boolean => {
  const stylizeFrame = (sources ?? []).find(
    (entry) =>
      entry.type === "reference_frame" ||
      entry.type === "key_frame" ||
      entry.type === "style_reference"
  );
  if (!stylizeFrame) return false;

  const imageCropSettings = getSourceCropSettings(stylizeFrame, tracks ?? []);
  if (!imageCropSettings) return false;

  const videoHasCrop =
    isShotCroppedSectionOfInputVideo({ crop }) &&
    !!inputVideoWidth &&
    !!inputVideoHeight;

  if (!videoHasCrop) return true;

  const absoluteRenderCrop = toAbsoluteCropRect({
    crop: crop!,
    sourceWidth: inputVideoWidth!,
    sourceHeight: inputVideoHeight!
  });

  const dimensionsMatch =
    imageCropSettings.sourceVideoDimensions[0] === inputVideoWidth &&
    imageCropSettings.sourceVideoDimensions[1] === inputVideoHeight;

  return !(
    dimensionsMatch &&
    isAbsoluteCropEqual(absoluteRenderCrop, imageCropSettings.cropCoordinates)
  );
};
