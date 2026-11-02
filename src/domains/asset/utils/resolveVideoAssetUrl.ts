import { VideoAssetResponse } from "@domains/asset/api/interface";

export const resolveVideoAssetUrl = (
  asset: VideoAssetResponse | undefined
): string | null => {
  if (!asset) return null;
  if ("urlToUse" in asset && asset.urlToUse) return asset.urlToUse;
  if ("s3_url" in asset && asset.s3_url) return asset.s3_url;
  return null;
};
