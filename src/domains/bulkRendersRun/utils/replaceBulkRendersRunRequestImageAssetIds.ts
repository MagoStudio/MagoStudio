import {
  BulkRendersRunSettings,
  CreateBulkRendersRunRequest
} from "@schemas/bulkRendersRun";

type BulkRendersRunShotOverride = NonNullable<
  CreateBulkRendersRunRequest["shot_overrides"]
>[string];

export const replaceBulkRendersRunRequestImageAssetIds = (
  request: CreateBulkRendersRunRequest,
  replacementAssetIdByAssetId: Map<string, string>
): CreateBulkRendersRunRequest => {
  const replaceAssetId = (assetId: string): string =>
    replacementAssetIdByAssetId.get(assetId) ?? assetId;

  const withReplacedReferenceImages = (
    img2imgSettings: BulkRendersRunSettings
  ): BulkRendersRunSettings =>
    Array.isArray(img2imgSettings.reference_images)
      ? {
          ...img2imgSettings,
          reference_images: img2imgSettings.reference_images.map(
            (assetId: unknown) =>
              typeof assetId === "string" ? replaceAssetId(assetId) : assetId
          )
        }
      : img2imgSettings;

  const withReplacedShotOverrideImages = (
    shotOverride: BulkRendersRunShotOverride
  ): BulkRendersRunShotOverride =>
    ({
      ...shotOverride,
      ...(shotOverride.images
        ? {
            images: shotOverride.images.map((image) => ({
              ...image,
              asset_id: replaceAssetId(image.asset_id)
            }))
          }
        : {}),
      ...(shotOverride.img2img_settings
        ? {
            img2img_settings: withReplacedReferenceImages(
              shotOverride.img2img_settings
            )
          }
        : {})
    }) as BulkRendersRunShotOverride;

  return {
    ...request,
    ...(request.img2img_settings
      ? {
          img2img_settings: withReplacedReferenceImages(
            request.img2img_settings
          )
        }
      : {}),
    ...(request.shot_overrides
      ? {
          shot_overrides: Object.fromEntries(
            Object.entries(request.shot_overrides).map(
              ([shotId, shotOverride]) => [
                shotId,
                withReplacedShotOverrideImages(shotOverride)
              ]
            )
          )
        }
      : {})
  };
};
