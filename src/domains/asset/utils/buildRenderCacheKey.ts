export const buildRenderCacheKey = (
  assetId: string,
  signedVideoUrl?: string | null
): string => {
  if (!signedVideoUrl) return assetId;
  try {
    return `${assetId}:${new URL(signedVideoUrl).pathname}`;
  } catch {
    return assetId;
  }
};
