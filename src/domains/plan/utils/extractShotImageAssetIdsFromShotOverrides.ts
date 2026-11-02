import { ShotOverride } from "@schemas/plan";

export const extractShotImageAssetIdsFromShotOverrides = (
  shotOverrides: Record<string, ShotOverride> | undefined
): Record<string, string> => {
  if (!shotOverrides) return {};
  const result: Record<string, string> = {};
  for (const [shotId, override] of Object.entries(shotOverrides)) {
    const assetId = override.images?.[0]?.asset_id;
    if (assetId) result[shotId] = assetId;
  }
  return result;
};
