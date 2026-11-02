import { NormalizedCropRect } from "@domains/renders/utils/cropRect";

export const isCropToolActive = (
  crop: NormalizedCropRect | undefined
): boolean => crop !== undefined;
