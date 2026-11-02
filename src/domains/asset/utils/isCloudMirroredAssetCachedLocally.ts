export const isCloudMirroredAssetCachedLocally = (
  localAsset: { data?: object } | null | undefined
): boolean => {
  const assetData = localAsset?.data;
  if (!assetData) return false;
  const isAssetMirroredFromCloud =
    "cloudMirror" in assetData && assetData.cloudMirror === true;
  const isMirroredFileDownloaded =
    "status" in assetData && assetData.status === "ingested";
  return isAssetMirroredFromCloud && isMirroredFileDownloaded;
};
