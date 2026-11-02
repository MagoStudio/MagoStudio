import { ImageAssetResponse } from "@domains/asset/interface";

export const createFileFromImageData = async (
  imageData: ImageAssetResponse
): Promise<File> => {
  const response = await fetch(imageData.urlToUse);
  const blob = await response.blob();

  const file = new File([blob], imageData.asset.name, {
    type: blob.type || "image/jpeg"
  });

  return file;
};
