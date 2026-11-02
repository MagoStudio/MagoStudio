import { getRemoteImageAsset } from "./getRemoteImageAsset";
import { ImageAssetResponse } from "./interface";

export const getImageAsset = async (
  assetId?: string
): Promise<ImageAssetResponse> => {
  if (!assetId) {
    throw new Error("Asset ID is required");
  }

  return getRemoteImageAsset(assetId);
};
