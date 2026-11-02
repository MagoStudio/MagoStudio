import { cacheGet, cacheSet } from "./cacheStorage";
import { downloadVideoInChunks } from "./downloadVideoInChunks";
import { mediaDownloads } from "./mediaDownloadScheduler";

/** A video whose render has not landed can answer `200` with nothing behind it, and a read
 * taken mid-write can stop short. Storing either one poisons the cache for every later visit,
 * so an empty body is thrown rather than kept, leaving the caller on the direct URL. */
export const getCachedVideoBlob = async (
  url: string,
  cacheKey: string = url
): Promise<Blob> => {
  const cached = await cacheGet("video", cacheKey);
  if (cached?.size) return cached;

  return mediaDownloads.enqueue({
    key: `video:${cacheKey}`,
    assetId: cacheKey,
    kind: "video",
    run: async (signal) => {
      const blob = await downloadVideoInChunks(
        url,
        undefined,
        cacheKey,
        signal
      );
      if (!blob.size) {
        throw new Error(`Video has no bytes yet: ${url}`);
      }

      await cacheSet("video", cacheKey, blob).catch((cacheError) => {
        console.warn("Failed to cache video:", cacheError);
      });
      return blob;
    }
  });
};
