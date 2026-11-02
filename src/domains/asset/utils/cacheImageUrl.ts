import { cacheGet } from "./cacheStorage";
import { downloadImageBlob } from "./downloadImageBlob";
import { toDesktopCloudStorageUrl } from "./toDesktopCloudStorageUrl";

const isFetchableAssetUrl = (url: string): boolean =>
  url.startsWith("https://");

/** The image mirror of `cacheVideoUrl`: read the blob from the local cache, or fetch it once
 * and write it back. `cacheKey` should be an asset id rather than a URL — the worker sanitises
 * a key down to `[a-zA-Z0-9_-]`, so two URLs can otherwise collide on one cached file.
 *
 * Mirrors its emptiness guard too: a render that has not landed can answer `200` with nothing
 * behind it, and storing that blank would outlive the render. */
export const cacheImageUrl = async (
  url: string,
  cacheKey: string
): Promise<{ urlToUse: string; isCached: boolean }> => {
  if (!isFetchableAssetUrl(url)) {
    return { urlToUse: url, isCached: false };
  }

  const readableUrl = toDesktopCloudStorageUrl(url);
  try {
    const cachedBlob = await cacheGet("image", cacheKey);
    if (cachedBlob?.size) {
      return { urlToUse: URL.createObjectURL(cachedBlob), isCached: true };
    }

    const blob = await downloadImageBlob(url, cacheKey);
    if (!blob.size) {
      return { urlToUse: readableUrl, isCached: false };
    }

    return { urlToUse: URL.createObjectURL(blob), isCached: true };
  } catch (error) {
    console.warn("Error downloading/caching image, using direct URL:", error);
    return { urlToUse: readableUrl, isCached: false };
  }
};
