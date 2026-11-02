import { AbsoluteCropRect, NormalizedCropRect } from "./types";

export const toNormalizedCropRect = ({
  crop,
  sourceWidth,
  sourceHeight
}: {
  crop: AbsoluteCropRect;
  sourceWidth: number;
  sourceHeight: number;
}): NormalizedCropRect => {
  const [topLeftX, topLeftY] = crop.topLeft;
  const [bottomRightX, bottomRightY] = crop.bottomRight;

  return {
    x: topLeftX / sourceWidth,
    y: topLeftY / sourceHeight,
    width: (bottomRightX - topLeftX) / sourceWidth,
    height: (bottomRightY - topLeftY) / sourceHeight
  };
};
