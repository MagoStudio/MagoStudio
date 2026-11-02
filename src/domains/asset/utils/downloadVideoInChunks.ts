import { mediaDownloads } from "./mediaDownloadScheduler";
import { toDesktopCloudStorageUrl } from "./toDesktopCloudStorageUrl";

const PROGRESS_PERCENTAGE_MULTIPLIER = 100;

interface DownloadProgress {
  receivedBytes: number;
  totalBytes: number;
  percentage: number;
}

export const downloadVideoInChunks = async (
  url: string,
  onProgress?: (progress: DownloadProgress) => void,
  assetId: string = url,
  signal?: AbortSignal
): Promise<Blob> =>
  signal
    ? readVideo(url, signal, onProgress)
    : mediaDownloads.enqueue({
        key: `video:${assetId}`,
        assetId,
        kind: "video",
        run: (signal) => readVideo(url, signal, onProgress)
      });

const readVideo = async (
  url: string,
  signal: AbortSignal,
  onProgress?: (progress: DownloadProgress) => void
): Promise<Blob> => {
  signal.throwIfAborted();
  const response = await fetch(toDesktopCloudStorageUrl(url), { signal });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch video: ${response.status} ${response.statusText}`
    );
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedLength = 0;

  const contentLength = response.headers.get("content-length");
  const totalLength = contentLength ? parseInt(contentLength) : 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    receivedLength += value.length;

    if (totalLength > 0) {
      const progress: DownloadProgress = {
        receivedBytes: receivedLength,
        totalBytes: totalLength,
        percentage:
          (receivedLength / totalLength) * PROGRESS_PERCENTAGE_MULTIPLIER
      };

      onProgress?.(progress);
    }
  }

  const blob = new Blob(
    chunks.map((chunk) => new Uint8Array(chunk)),
    {
      type: response.headers.get("content-type") || "video/mp4"
    }
  );

  return blob;
};
