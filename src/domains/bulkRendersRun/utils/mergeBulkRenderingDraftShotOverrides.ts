import { Img2ImgType } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { VideoSettings } from "@models/video/types";

import {
  BulkRendersRunShotPromptOverride,
  BulkRendersRunShotSettingsOverride
} from "./buildCreateBulkRendersRunRequest";

export const mergeBulkRenderingDraftShotOverrides = ({
  shotPromptOverrideById,
  imageReferenceAssetIdsOverrideByShotId,
  imageSettingsOverrideByShotId,
  imageSourceFrameOverrideByShotId,
  shotVideoSettingsOverrideById,
  uploadedFirstFrameAssetIdByShotId
}: {
  shotPromptOverrideById: Record<string, BulkRendersRunShotPromptOverride>;
  imageReferenceAssetIdsOverrideByShotId: Record<string, string[]>;
  imageSettingsOverrideByShotId: Record<string, Img2ImgType>;
  imageSourceFrameOverrideByShotId: Record<string, number>;
  shotVideoSettingsOverrideById: Record<string, Partial<VideoSettings>>;
  uploadedFirstFrameAssetIdByShotId: Record<string, string>;
}): Record<string, BulkRendersRunShotSettingsOverride> => {
  const overriddenShotIds = new Set([
    ...Object.keys(shotPromptOverrideById),
    ...Object.keys(imageReferenceAssetIdsOverrideByShotId),
    ...Object.keys(imageSettingsOverrideByShotId),
    ...Object.keys(imageSourceFrameOverrideByShotId),
    ...Object.keys(shotVideoSettingsOverrideById),
    ...Object.keys(uploadedFirstFrameAssetIdByShotId)
  ]);

  return Object.fromEntries(
    Array.from(overriddenShotIds).map((shotId) => {
      const imageReferenceAssetIds =
        imageReferenceAssetIdsOverrideByShotId[shotId];
      const imageSettings = imageSettingsOverrideByShotId[shotId];
      const imageSourceFrame = imageSourceFrameOverrideByShotId[shotId];
      const videoSettingsPatch = shotVideoSettingsOverrideById[shotId];
      const uploadedFirstFrameAssetId =
        uploadedFirstFrameAssetIdByShotId[shotId];

      return [
        shotId,
        {
          ...shotPromptOverrideById[shotId],
          ...(imageReferenceAssetIds ? { imageReferenceAssetIds } : {}),
          ...(imageSettings ? { imageSettings } : {}),
          ...(imageSourceFrame !== undefined ? { imageSourceFrame } : {}),
          ...(videoSettingsPatch ? { videoSettingsPatch } : {}),
          ...(uploadedFirstFrameAssetId ? { uploadedFirstFrameAssetId } : {})
        }
      ];
    })
  );
};
