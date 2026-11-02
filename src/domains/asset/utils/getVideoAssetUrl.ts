import { VideoAssetResponse } from "../api/interface";

export const getVideoAssetUrl = (
  videoAsset: VideoAssetResponse | undefined
): string | undefined => {
  if (!videoAsset) return undefined;

  if ("urlToUse" in videoAsset && videoAsset.urlToUse)
    return videoAsset.urlToUse;
  if ("s3_url" in videoAsset && videoAsset.s3_url) return videoAsset.s3_url;

  return undefined;
};
