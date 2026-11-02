/* oxlint-disable custom-react/no-use-effect -- syncs to an external resource: the image at imageUrl must load before its intrinsic dimensions can be read, and the URL changes as thumbnails resolve */
import { useEffect, useState } from "react";

type ImageOrientationMeasurement = {
  measuredImageUrl: string;
  isImagePortrait: boolean;
};

export function useIsImagePortrait(imageUrl: string | undefined) {
  const [measurement, setMeasurement] = useState<ImageOrientationMeasurement>();

  useEffect(() => {
    if (!imageUrl) return;

    const image = new Image();
    let hasStoppedListening = false;

    image.onload = () => {
      if (hasStoppedListening) return;
      setMeasurement({
        measuredImageUrl: imageUrl,
        isImagePortrait: image.naturalHeight > image.naturalWidth
      });
    };
    image.src = imageUrl;

    return () => {
      hasStoppedListening = true;
    };
  }, [imageUrl]);

  if (!imageUrl || measurement?.measuredImageUrl !== imageUrl) return undefined;

  return measurement.isImagePortrait;
}
