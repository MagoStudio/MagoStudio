import {
  Img2ImgSchema,
  Img2ImgType
} from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { GptImage2Quality } from "@home/components/Navbar/Img2ImgModalV2/schemas/gptImage2.schema";
import { Nanobanana2Resolution } from "@home/components/Navbar/Img2ImgModalV2/schemas/nanobanana2.schema";

export const buildBulkRenderingDraftShotImageSettings = ({
  masterImageSettings,
  shotImageModel,
  shotPrompt,
  shotReferenceAssetIds,
  shotImageSettingKey,
  shotImageSettingValue
}: {
  masterImageSettings: Img2ImgType;
  shotImageModel: Img2ImgType["model"];
  shotPrompt: string;
  shotReferenceAssetIds: string[];
  shotImageSettingKey?: "quality" | "resolution";
  shotImageSettingValue?: GptImage2Quality | Nanobanana2Resolution | number;
}): Img2ImgType => {
  const { frameType, uploadedImageId, iteratedAssetId, iteratedSourceFrame } =
    masterImageSettings;

  const withShotImageSettingOverride = (settings: Img2ImgType): Img2ImgType =>
    shotImageSettingKey && shotImageSettingValue !== undefined
      ? ({
          ...settings,
          [shotImageSettingKey]: shotImageSettingValue
        } as Img2ImgType)
      : settings;

  if (shotImageModel === masterImageSettings.model) {
    return withShotImageSettingOverride({
      ...masterImageSettings,
      prompt: shotPrompt,
      referenceImages: shotReferenceAssetIds
    });
  }

  return withShotImageSettingOverride(
    Img2ImgSchema.parse({
      model: shotImageModel,
      frameType,
      uploadedImageId,
      iteratedAssetId,
      iteratedSourceFrame,
      prompt: shotPrompt,
      referenceImages: shotReferenceAssetIds
    }) as Img2ImgType
  );
};
