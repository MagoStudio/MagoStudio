import { useCachedImageUrl } from "./data/useCachedImageUrl";
import { toDesktopCloudStorageUrl } from "./utils/toDesktopCloudStorageUrl";

export const useCachedOrProxiedImageUrl = (
  imageUrl: string | undefined,
  cacheKey: string | undefined,
  enabled = true
): string | undefined => {
  const cachedImageUrl = useCachedImageUrl(
    imageUrl,
    cacheKey ?? "",
    enabled && !!cacheKey
  );
  if (cachedImageUrl) return cachedImageUrl;
  return imageUrl ? toDesktopCloudStorageUrl(imageUrl) : undefined;
};
