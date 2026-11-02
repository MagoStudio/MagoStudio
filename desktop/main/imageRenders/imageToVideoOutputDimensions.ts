import type { ImageToVideoResolution } from "./imageToVideoModels";

const SHORT_SIDE_BY_RESOLUTION: Record<ImageToVideoResolution, number> = {
  "480p": 480,
  "720p": 720,
  "1080p": 1080,
  "4k": 2160
};
const EVEN_PIXEL_ALIGNMENT = 2;

const toEvenPixels = (value: number): number =>
  Math.max(
    EVEN_PIXEL_ALIGNMENT,
    Math.round(value / EVEN_PIXEL_ALIGNMENT) * EVEN_PIXEL_ALIGNMENT
  );

export const estimateImageToVideoOutputDimensions = (
  resolution: ImageToVideoResolution,
  startImageDimensions: { width: number | null; height: number | null }
): { width: number; height: number } => {
  const shortSide = SHORT_SIDE_BY_RESOLUTION[resolution];
  const { width, height } = startImageDimensions;
  if (!width || !height || width <= 0 || height <= 0)
    return { width: shortSide, height: shortSide };
  if (width >= height)
    return {
      width: toEvenPixels((width / height) * shortSide),
      height: shortSide
    };
  return {
    width: shortSide,
    height: toEvenPixels((height / width) * shortSide)
  };
};
