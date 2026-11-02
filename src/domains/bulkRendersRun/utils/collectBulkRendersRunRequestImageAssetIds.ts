import { CreateBulkRendersRunRequest } from "@schemas/bulkRendersRun";

const referenceImageAssetIdsOf = (
  img2imgSettings: Record<string, unknown> | undefined
): string[] =>
  Array.isArray(img2imgSettings?.reference_images)
    ? img2imgSettings.reference_images.filter(
        (assetId): assetId is string =>
          typeof assetId === "string" && assetId !== ""
      )
    : [];

export const collectBulkRendersRunRequestImageAssetIds = (
  request: CreateBulkRendersRunRequest
): string[] => {
  const shotOverrides = Object.values(request.shot_overrides ?? {});
  const imageAssetIds = [
    ...referenceImageAssetIdsOf(request.img2img_settings),
    ...shotOverrides.flatMap((shotOverride) => [
      ...(shotOverride.images ?? []).map((image) => image.asset_id),
      ...referenceImageAssetIdsOf(shotOverride.img2img_settings)
    ])
  ];
  return [...new Set(imageAssetIds)];
};
