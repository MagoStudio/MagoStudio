import { toNormalizedCropRect } from "@domains/renders/utils/cropRect";
/* oxlint-disable custom-react/no-use-effect -- crops an off-DOM image to a data URL, an async external transform */
import { SourceImageCrop } from "@domains/renders/utils/getImg2ImgClipCrop";
import { cropImageToNormalizedRect } from "@utils/image/cropImageToNormalizedRect";
import { useEffect, useState } from "react";

interface UseCroppedSourceImageSrcOptions {
  sourceImageSrc: string | undefined;
  imageCrop: SourceImageCrop | undefined;
}

interface CroppedSourcePreview {
  key: string;
  dataUrl: string;
}

const getCropKey = (
  sourceImageSrc: string,
  imageCrop: SourceImageCrop
): string => {
  const [topLeftX, topLeftY] = imageCrop.crop_coordinates.top_left;
  const [bottomRightX, bottomRightY] = imageCrop.crop_coordinates.bottom_right;
  const [sourceWidth, sourceHeight] = imageCrop.source_video_dimensions;
  return `${sourceImageSrc}|${topLeftX},${topLeftY},${bottomRightX},${bottomRightY}|${sourceWidth}x${sourceHeight}`;
};

export const useCroppedSourceImageSrc = ({
  sourceImageSrc,
  imageCrop
}: UseCroppedSourceImageSrcOptions): string | undefined => {
  const [croppedSourcePreview, setCroppedSourcePreview] =
    useState<CroppedSourcePreview | null>(null);

  const cropKey =
    sourceImageSrc && imageCrop
      ? getCropKey(sourceImageSrc, imageCrop)
      : undefined;

  useEffect(() => {
    if (!cropKey || !sourceImageSrc || !imageCrop) return;

    let isCurrentCropRequest = true;
    const [sourceWidth, sourceHeight] = imageCrop.source_video_dimensions;
    const normalizedCrop = toNormalizedCropRect({
      crop: {
        topLeft: imageCrop.crop_coordinates.top_left,
        bottomRight: imageCrop.crop_coordinates.bottom_right
      },
      sourceWidth,
      sourceHeight
    });

    cropImageToNormalizedRect({
      imageSrc: sourceImageSrc,
      crop: normalizedCrop
    })
      .then((dataUrl) => {
        if (isCurrentCropRequest)
          setCroppedSourcePreview({ key: cropKey, dataUrl });
      })
      .catch((error) => {
        console.error("Failed to crop img2img source preview:", error);
      });

    return () => {
      isCurrentCropRequest = false;
    };
  }, [cropKey, sourceImageSrc, imageCrop]);

  if (!imageCrop) return sourceImageSrc;
  if (croppedSourcePreview && croppedSourcePreview.key === cropKey)
    return croppedSourcePreview.dataUrl;
  return undefined;
};
