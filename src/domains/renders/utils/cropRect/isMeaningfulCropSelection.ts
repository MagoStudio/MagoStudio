import { hasPositiveCropArea } from "./hasPositiveCropArea";
import { isFullFrameCropRect } from "./isFullFrameCropRect";
import { NormalizedCropRect } from "./types";

export const isMeaningfulCropSelection = ({
  crop
}: {
  crop: NormalizedCropRect | undefined;
}): boolean =>
  !!crop && hasPositiveCropArea({ crop }) && !isFullFrameCropRect({ crop });
