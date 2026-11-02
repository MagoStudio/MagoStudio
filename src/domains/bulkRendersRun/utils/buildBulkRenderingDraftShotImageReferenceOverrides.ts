const haveSameAssetIdsInSameOrder = (
  left: string[],
  right: string[]
): boolean =>
  left.length === right.length &&
  left.every((assetId, index) => assetId === right[index]);

export const buildBulkRenderingDraftShotImageReferenceOverrides = ({
  imageReferenceAssetIdsByShotId,
  defaultImageReferenceAssetIds
}: {
  imageReferenceAssetIdsByShotId: Record<string, string[]>;
  defaultImageReferenceAssetIds: string[];
}): Record<string, string[]> =>
  Object.fromEntries(
    Object.entries(imageReferenceAssetIdsByShotId).filter(
      ([, assetIds]) =>
        !haveSameAssetIdsInSameOrder(assetIds, defaultImageReferenceAssetIds)
    )
  );
