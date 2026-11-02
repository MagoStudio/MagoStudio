export const toCloudSourceVideoLinkLocalId = ({
  localAssetId,
  localShotId,
  sourceVideoTrimKey
}: {
  localAssetId: string;
  localShotId: string;
  sourceVideoTrimKey: string;
}): string => `${localAssetId}#shot-${localShotId}#trim-${sourceVideoTrimKey}`;
