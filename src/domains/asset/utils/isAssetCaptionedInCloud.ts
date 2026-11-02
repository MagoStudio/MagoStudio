export const isAssetCaptionedInCloud = ({
  localAsset,
  isCloudAccountActive
}: {
  localAsset: { data?: object } | null | undefined;
  isCloudAccountActive: boolean;
}): boolean => {
  if (!localAsset) return isCloudAccountActive;
  const assetData = localAsset.data;
  const isAssetMirroredFromCloud =
    !!assetData && "cloudMirror" in assetData && assetData.cloudMirror === true;
  return isAssetMirroredFromCloud && isCloudAccountActive;
};
