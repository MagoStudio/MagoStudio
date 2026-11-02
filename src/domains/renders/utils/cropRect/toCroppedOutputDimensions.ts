import { isShotCroppedSectionOfInputVideo } from "./isShotCroppedSectionOfInputVideo";
import { NormalizedCropRect } from "./types";

export interface CroppedOutputDimensions {
  width: number;
  height: number;
}

export const toCroppedOutputDimensions = ({
  crop,
  sourceWidth,
  sourceHeight
}: {
  crop: NormalizedCropRect | undefined;
  sourceWidth: number | undefined;
  sourceHeight: number | undefined;
}): CroppedOutputDimensions => {
  const fallbackDimensions = {
    width: sourceWidth ?? 0,
    height: sourceHeight ?? 0
  };

  if (!crop) return fallbackDimensions;
  if (!isShotCroppedSectionOfInputVideo({ crop })) return fallbackDimensions;
  if (!sourceWidth || !sourceHeight) return fallbackDimensions;

  const croppedWidth = Math.round(crop.width * sourceWidth);
  const croppedHeight = Math.round(crop.height * sourceHeight);

  if (croppedWidth <= 0 || croppedHeight <= 0) return fallbackDimensions;

  return { width: croppedWidth, height: croppedHeight };
};
