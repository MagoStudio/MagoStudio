import { NormalizedCropRect } from "@domains/renders/utils/cropRect";

const DEFAULT_IMAGE_QUALITY = 0.95;

export interface CropImageOptions {
  imageSrc: string;
  crop: NormalizedCropRect;
  imageFormat?: "image/jpeg" | "image/png";
  imageQuality?: number;
}

export const cropImageToNormalizedRect = async ({
  imageSrc,
  crop,
  imageFormat = "image/jpeg",
  imageQuality = DEFAULT_IMAGE_QUALITY
}: CropImageOptions): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const sourceX = Math.round(crop.x * img.width);
        const sourceY = Math.round(crop.y * img.height);
        const sourceWidth = Math.round(crop.width * img.width);
        const sourceHeight = Math.round(crop.height * img.height);

        const canvas = document.createElement("canvas");
        canvas.width = sourceWidth;
        canvas.height = sourceHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          sourceWidth,
          sourceHeight
        );

        resolve(canvas.toDataURL(imageFormat, imageQuality));
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error(`Failed to load image: ${imageSrc}`));

    img.src = imageSrc;
  });
};
