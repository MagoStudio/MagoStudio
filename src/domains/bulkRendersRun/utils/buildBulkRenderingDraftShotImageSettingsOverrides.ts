import { Img2ImgType } from "@home/components/Navbar/Img2ImgModalV2/schemas";

export const buildBulkRenderingDraftShotImageSettingsOverrides = ({
  imageSettingsByShotId,
  defaultImageModel,
  hasShotImageSettingOverrideById = {}
}: {
  imageSettingsByShotId: Record<string, Img2ImgType>;
  defaultImageModel: Img2ImgType["model"];
  hasShotImageSettingOverrideById?: Record<string, boolean>;
}): Record<string, Img2ImgType> =>
  Object.fromEntries(
    Object.entries(imageSettingsByShotId).filter(
      ([shotId, imageSettings]) =>
        imageSettings.model !== defaultImageModel ||
        hasShotImageSettingOverrideById[shotId]
    )
  );
