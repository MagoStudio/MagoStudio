import { Img2ImgSchema, Img2ImgType } from "../../schemas";

type InputImageOverride = {
  frameImage?: File[];
  frameType?: "upload" | "video";
  uploadedImageId?: string;
};

export const parseSettingsToImg2ImgForm = (
  renderSettings: Record<string, unknown>,
  inputImageOverride: InputImageOverride = {}
): Img2ImgType => {
  return Img2ImgSchema.parse({
    model: renderSettings.render_model,
    referenceImages: renderSettings.reference_images,
    maskImages: renderSettings.mask_image_id
      ? [renderSettings.mask_image_id]
      : [],
    ...inputImageOverride,
    ...renderSettings
  });
};
