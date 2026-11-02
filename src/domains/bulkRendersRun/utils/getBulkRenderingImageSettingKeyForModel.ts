import { Img2ImgType } from "@home/components/Navbar/Img2ImgModalV2/schemas";

const IMAGE_SETTING_KEY_BY_MODEL: Partial<
  Record<Img2ImgType["model"], "quality" | "resolution">
> = {
  gpt_image_2: "quality",
  nanobanana_2: "resolution"
};

export const getBulkRenderingImageSettingKeyForModel = (
  model: Img2ImgType["model"]
): "quality" | "resolution" | undefined => IMAGE_SETTING_KEY_BY_MODEL[model];
