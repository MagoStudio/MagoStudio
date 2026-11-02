import { backendApiClient } from "@/lib/backend-api-client";

import { cacheGet } from "../utils/cacheStorage";
import { downloadImageBlob } from "../utils/downloadImageBlob";
import { toDesktopCloudStorageUrl } from "../utils/toDesktopCloudStorageUrl";

import { ImageAssetResponse } from "./interface";

export const getRemoteImageAsset = async (
  assetId: string
): Promise<ImageAssetResponse> => {
  const response = await backendApiClient.get(`/assets/${assetId}`);
  const cachedBlob = await cacheGet("image", assetId);
  if (cachedBlob) {
    return { ...response.data, urlToUse: URL.createObjectURL(cachedBlob) };
  }

  const responseUrl = response.data.original_url || response.data.s3_url;
  if (!responseUrl) return { ...response.data, urlToUse: responseUrl };

  const readableResponseUrl = toDesktopCloudStorageUrl(responseUrl);
  try {
    const blob = await downloadImageBlob(responseUrl, assetId);
    return { ...response.data, urlToUse: URL.createObjectURL(blob) };
  } catch (error) {
    console.log("error creating blob", error);
    return { ...response.data, urlToUse: readableResponseUrl };
  }
};
