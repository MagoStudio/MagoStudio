import { BulkRenderingDraftShotImageSettingPatch } from "@store/atoms";

export const buildBulkRenderingDraftShotImageSettingOverrides = ({
  imageSettingByShotId
}: {
  imageSettingByShotId: Record<string, BulkRenderingDraftShotImageSettingPatch>;
}): Record<string, BulkRenderingDraftShotImageSettingPatch> =>
  Object.fromEntries(
    Object.entries(imageSettingByShotId).filter(
      ([, imageSettingPatch]) => Object.keys(imageSettingPatch).length > 0
    )
  );
