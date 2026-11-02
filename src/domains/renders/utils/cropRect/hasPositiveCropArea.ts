import { NormalizedCropRect } from "./types";

export const hasPositiveCropArea = ({
  crop
}: {
  crop: NormalizedCropRect;
}): boolean =>
  Number.isFinite(crop.x) &&
  Number.isFinite(crop.y) &&
  Number.isFinite(crop.width) &&
  Number.isFinite(crop.height) &&
  crop.width > 0 &&
  crop.height > 0;
