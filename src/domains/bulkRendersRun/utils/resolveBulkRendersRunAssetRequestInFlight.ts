export const resolveBulkRendersRunAssetRequestInFlight = ({
  assetId,
  resolvedUrl,
  requestedAssetIds,
  isAssetBatchLoading
}: {
  assetId: string | undefined;
  resolvedUrl: string | undefined;
  requestedAssetIds: ReadonlySet<string>;
  isAssetBatchLoading: boolean;
}): boolean => {
  if (!assetId || resolvedUrl) return false;

  return requestedAssetIds.has(assetId) && isAssetBatchLoading;
};
