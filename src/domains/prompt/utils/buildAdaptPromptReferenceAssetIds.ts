export const buildAdaptPromptReferenceAssetIds = ({
  sourceVideoAssetId,
  referenceImageAssetIds
}: {
  sourceVideoAssetId: string | undefined;
  referenceImageAssetIds: string[];
}): string[] =>
  sourceVideoAssetId
    ? [sourceVideoAssetId, ...referenceImageAssetIds]
    : referenceImageAssetIds;
