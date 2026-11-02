import { AbsoluteCropRect, NormalizedCropRect } from "./types";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const toAbsoluteCropRect = ({
  crop,
  sourceWidth,
  sourceHeight
}: {
  crop: NormalizedCropRect;
  sourceWidth: number;
  sourceHeight: number;
}): AbsoluteCropRect => {
  const rawTopLeftX = crop.x * sourceWidth;
  const rawTopLeftY = crop.y * sourceHeight;
  const rawBottomRightX = (crop.x + crop.width) * sourceWidth;
  const rawBottomRightY = (crop.y + crop.height) * sourceHeight;

  const topLeftX = clamp(Math.round(rawTopLeftX), 0, sourceWidth);
  const topLeftY = clamp(Math.round(rawTopLeftY), 0, sourceHeight);
  const bottomRightX = clamp(Math.round(rawBottomRightX), 0, sourceWidth);
  const bottomRightY = clamp(Math.round(rawBottomRightY), 0, sourceHeight);

  return {
    topLeft: [topLeftX, topLeftY],
    bottomRight: [bottomRightX, bottomRightY]
  };
};
