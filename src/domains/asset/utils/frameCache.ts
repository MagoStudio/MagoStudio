import { cacheGet, cacheSet } from "./cacheStorage";

function getFrameCacheKey(
  assetId: string,
  frameNumber: number,
  fps?: number
): string {
  return fps
    ? `${assetId}_f${frameNumber}_fps${fps}`
    : `${assetId}_f${frameNumber}`;
}

export async function getFrameFromCache(
  assetId: string,
  frameNumber: number,
  fps?: number
): Promise<string | null> {
  try {
    const key = getFrameCacheKey(assetId, frameNumber, fps);
    const blob = await cacheGet("frame", key);

    if (!blob) return null;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function saveFrameToCache(
  assetId: string,
  frameNumber: number,
  dataUrl: string,
  fps?: number
): Promise<void> {
  try {
    const key = getFrameCacheKey(assetId, frameNumber, fps);
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    await cacheSet("frame", key, blob);
  } catch (error) {
    console.warn("Failed to save frame to cache:", error);
  }
}
