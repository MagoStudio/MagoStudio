import { NormalizedCropRect } from "./types";

const FULL_FRAME_EPSILON = 0.001;

export const isFullFrameCropRect = ({
  crop
}: {
  crop: NormalizedCropRect;
}): boolean =>
  crop.x <= FULL_FRAME_EPSILON &&
  crop.y <= FULL_FRAME_EPSILON &&
  crop.x + crop.width >= 1 - FULL_FRAME_EPSILON &&
  crop.y + crop.height >= 1 - FULL_FRAME_EPSILON;
