import { getAssetDimensions } from "@domains/asset/utils/getAssetDimensions";
import { Layer } from "@schemas/layer";

import { getTrackAssetData } from "./getTrackAssetData";

export const isLandscapeTrack = (track: Layer | undefined): boolean => {
  const { width, height } = getAssetDimensions(getTrackAssetData(track));

  if (!width || !height || width <= 0 || height <= 0) {
    return false;
  }

  return width > height;
};
