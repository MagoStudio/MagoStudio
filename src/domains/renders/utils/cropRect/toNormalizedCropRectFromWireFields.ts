import { CropWireFields } from "./toCropWireFields";
import { toNormalizedCropRect } from "./toNormalizedCropRect";
import { NormalizedCropRect } from "./types";

const isFiniteCoordinatePair = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((entry) => typeof entry === "number" && Number.isFinite(entry));

export const toNormalizedCropRectFromWireFields = (
  wireFields: CropWireFields | undefined
): NormalizedCropRect | undefined => {
  const cropCoordinates = wireFields?.crop_coordinates;
  const sourceVideoDimensions = wireFields?.source_video_dimensions;
  if (!cropCoordinates || !sourceVideoDimensions) return undefined;

  if (
    !isFiniteCoordinatePair(cropCoordinates.top_left) ||
    !isFiniteCoordinatePair(cropCoordinates.bottom_right) ||
    !isFiniteCoordinatePair(sourceVideoDimensions)
  ) {
    return undefined;
  }

  const [sourceWidth, sourceHeight] = sourceVideoDimensions;
  if (sourceWidth <= 0 || sourceHeight <= 0) return undefined;

  return toNormalizedCropRect({
    crop: {
      topLeft: cropCoordinates.top_left,
      bottomRight: cropCoordinates.bottom_right
    },
    sourceWidth,
    sourceHeight
  });
};
