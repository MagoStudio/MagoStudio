import { getCachedVideoBlob } from "./getCachedVideoBlob";
import { toDesktopCloudStorageUrl } from "./toDesktopCloudStorageUrl";

/** A render that has not landed can answer `200` with nothing behind it, and a read taken
 * mid-write can stop short. An empty body is left uncached and the direct URL handed back, so
 * the next attempt sees the finished video rather than a stored blank. */
export const cacheVideoUrl = async (
  url: string,
  cacheKey: string
): Promise<{ urlToUse: string; isCached: boolean }> => {
  try {
    const blob = await getCachedVideoBlob(url, cacheKey);

    const blobUrl = URL.createObjectURL(blob);
    return { urlToUse: blobUrl, isCached: true };
  } catch (error) {
    console.warn("Error downloading/caching video, using direct URL:", error);
    return { urlToUse: toDesktopCloudStorageUrl(url), isCached: false };
  }
};
