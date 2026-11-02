import {
  areNormalizedCropRectsEqual,
  isShotCroppedSectionOfInputVideo,
  NormalizedCropRect
} from "@domains/renders/utils/cropRect";

export type ShotCropOverwriteWarning = "replace" | "remove";

export const getShotCropOverwriteWarning = ({
  shotCrop,
  usedImageCropRect
}: {
  shotCrop: NormalizedCropRect | undefined;
  usedImageCropRect: NormalizedCropRect | undefined;
}): ShotCropOverwriteWarning | undefined => {
  if (!isShotCroppedSectionOfInputVideo({ crop: shotCrop })) return undefined;
  if (!usedImageCropRect) return "remove";
  if (areNormalizedCropRectsEqual(shotCrop, usedImageCropRect))
    return undefined;
  return "replace";
};
