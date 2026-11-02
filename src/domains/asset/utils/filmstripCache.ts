import { cacheGet, cacheSet } from "./cacheStorage";

function getFilmstripCacheKey(assetId: string, width: number): string {
  return `${assetId}_${width}`;
}

export async function getFilmstripFromCache(
  assetId: string,
  width: number
): Promise<string | null> {
  try {
    const key = getFilmstripCacheKey(assetId, width);
    const blob = await cacheGet("filmstrip", key);

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

export async function saveFilmstripToCache(
  assetId: string,
  width: number,
  dataUrl: string
): Promise<void> {
  try {
    const key = getFilmstripCacheKey(assetId, width);
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    await cacheSet("filmstrip", key, blob);
  } catch (error) {
    console.warn("Failed to save filmstrip to cache:", error);
  }
}
