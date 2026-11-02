import { Img2ImgType } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { TRANSIENT_IMG2IMG_STORAGE_KEYS } from "@home/components/Navbar/Img2ImgModalV2/schemas/seedream5Pro.schema";

export const sanitizeImg2ImgForStorage = (values: Img2ImgType): Img2ImgType => {
  const next = { ...values } as Record<string, unknown>;
  for (const key of TRANSIENT_IMG2IMG_STORAGE_KEYS) {
    delete next[key];
  }
  return next as unknown as Img2ImgType;
};
