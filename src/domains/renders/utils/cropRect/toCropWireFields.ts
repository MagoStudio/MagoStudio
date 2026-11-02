import { isShotCroppedSectionOfInputVideo } from "./isShotCroppedSectionOfInputVideo";
import { toAbsoluteCropRect } from "./toAbsoluteCropRect";
import { NormalizedCropRect } from "./types";

export interface CropWireFields {
  crop_coordinates?: {
    top_left: [number, number];
    bottom_right: [number, number];
  };
  source_video_dimensions?: [number, number];
}

export const toCropWireFields = ({
  crop,
  sourceWidth,
  sourceHeight
}: {
  crop: NormalizedCropRect | undefined;
  sourceWidth: number | undefined;
  sourceHeight: number | undefined;
}): CropWireFields => {
  if (!crop) return {};
  if (!isShotCroppedSectionOfInputVideo({ crop })) return {};
  if (!sourceWidth || !sourceHeight) return {};

  const { topLeft, bottomRight } = toAbsoluteCropRect({
    crop,
    sourceWidth,
    sourceHeight
  });

  return {
    crop_coordinates: { top_left: topLeft, bottom_right: bottomRight },
    source_video_dimensions: [sourceWidth, sourceHeight]
  };
};
