import { NormalizedCropRect } from "./types";

const CROP_RECT_EQUALITY_EPSILON = 0.001;

export const areNormalizedCropRectsEqual = (
  first: NormalizedCropRect | undefined,
  second: NormalizedCropRect | undefined
): boolean => {
  if (!first || !second) return first === second;

  return (
    Math.abs(first.x - second.x) <= CROP_RECT_EQUALITY_EPSILON &&
    Math.abs(first.y - second.y) <= CROP_RECT_EQUALITY_EPSILON &&
    Math.abs(first.width - second.width) <= CROP_RECT_EQUALITY_EPSILON &&
    Math.abs(first.height - second.height) <= CROP_RECT_EQUALITY_EPSILON
  );
};
