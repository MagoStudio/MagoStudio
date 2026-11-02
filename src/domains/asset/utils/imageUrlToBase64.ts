import { resizeImageFromUrl } from "@utils/image/resizeImage";

import { toDesktopCloudStorageUrl } from "./toDesktopCloudStorageUrl";

const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  if (imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  const response = await fetch(toDesktopCloudStorageUrl(imageUrl));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching image`);
  }

  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image as Base64"));
    reader.readAsDataURL(blob);
  });
};

export const imageUrlToBase64 = async (
  imageUrl: string,
  resizeToMaxDimension?: number
): Promise<string> => {
  if (!imageUrl) throw new Error("Empty imageUrl");

  if (resizeToMaxDimension) {
    return resizeImageFromUrl(toDesktopCloudStorageUrl(imageUrl), {
      maxWidth: resizeToMaxDimension,
      maxHeight: resizeToMaxDimension
    });
  }

  return convertImageToBase64(imageUrl);
};
