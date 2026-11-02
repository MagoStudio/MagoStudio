import { cacheSet } from "./cacheStorage";
import { mediaDownloads } from "./mediaDownloadScheduler";
import { toDesktopCloudStorageUrl } from "./toDesktopCloudStorageUrl";

export const downloadImageBlob = (
  url: string,
  assetId: string
): Promise<Blob> =>
  mediaDownloads.enqueue({
    key: `image:${assetId}`,
    assetId: assetId.replace(/_thumb$/, ""),
    kind: "image",
    run: async (signal) => {
      signal.throwIfAborted();
      const response = await fetch(toDesktopCloudStorageUrl(url), { signal });
      if (!response.ok)
        throw new Error(`Failed to fetch image: ${response.status}`);
      const blob = await response.blob();
      if (!blob.size) throw new Error("Image has no bytes yet");
      await cacheSet("image", assetId, blob).catch((error) =>
        console.warn("Failed to cache image", error)
      );
      return blob;
    }
  });
