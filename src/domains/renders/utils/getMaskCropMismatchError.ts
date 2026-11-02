import { getTrackCropSettings } from "@domains/track/utils/getTrackCropSettings";
import { Layer } from "@schemas/layer";

import {
  hasPositiveCropArea,
  isFullFrameCropRect,
  NormalizedCropRect,
  toAbsoluteCropRect
} from "./cropRect";

const isAbsoluteCropEqual = (
  a: { topLeft: [number, number]; bottomRight: [number, number] },
  b: { topLeft: [number, number]; bottomRight: [number, number] }
): boolean =>
  a.topLeft[0] === b.topLeft[0] &&
  a.topLeft[1] === b.topLeft[1] &&
  a.bottomRight[0] === b.bottomRight[0] &&
  a.bottomRight[1] === b.bottomRight[1];

export const getMaskCropMismatchError = ({
  crop,
  inputVideoWidth,
  inputVideoHeight,
  maskTrack
}: {
  crop: NormalizedCropRect | undefined;
  inputVideoWidth: number | undefined;
  inputVideoHeight: number | undefined;
  maskTrack: Layer | undefined;
}): boolean => {
  if (!maskTrack) return false;

  const isRenderCropped =
    !!crop &&
    hasPositiveCropArea({ crop }) &&
    !isFullFrameCropRect({ crop }) &&
    !!inputVideoWidth &&
    !!inputVideoHeight;

  const maskCropSettings = getTrackCropSettings(maskTrack);
  const isMaskCropped = !!maskCropSettings;

  if (!isRenderCropped && !isMaskCropped) return false;
  if (isRenderCropped !== isMaskCropped) return true;

  const absoluteRenderCrop = toAbsoluteCropRect({
    crop: crop!,
    sourceWidth: inputVideoWidth!,
    sourceHeight: inputVideoHeight!
  });

  const sourceDimensionsMatch =
    maskCropSettings!.sourceVideoDimensions[0] === inputVideoWidth &&
    maskCropSettings!.sourceVideoDimensions[1] === inputVideoHeight;

  return !(
    sourceDimensionsMatch &&
    isAbsoluteCropEqual(absoluteRenderCrop, maskCropSettings!.cropCoordinates)
  );
};
