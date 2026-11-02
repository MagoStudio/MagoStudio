import type { CacheType, OPFSRequest, OPFSResponse } from "./opfsMessages";

const CACHE_DIR_NAME = "mago-cache";

async function getCacheDirectory(
  cacheType: CacheType
): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  const cacheRoot = await root.getDirectoryHandle(CACHE_DIR_NAME, {
    create: true
  });

  const subDirName =
    cacheType === "video"
      ? "videos"
      : cacheType === "image"
        ? "images"
        : cacheType === "frame"
          ? "frames"
          : "filmstrips";

  return cacheRoot.getDirectoryHandle(subDirName, { create: true });
}

function getFileName(cacheType: CacheType, key: string): string {
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
  const extension =
    cacheType === "filmstrip" || cacheType === "frame"
      ? "jpg"
      : cacheType === "image"
        ? "png"
        : "mp4";
  return `${safeKey}.${extension}`;
}

async function writeFile(
  cacheType: CacheType,
  key: string,
  data: ArrayBuffer
): Promise<void> {
  const dir = await getCacheDirectory(cacheType);
  const fileName = getFileName(cacheType, key);
  const fileHandle = await dir.getFileHandle(fileName, { create: true });

  const writable = await fileHandle.createWritable();
  try {
    await writable.write(data);
  } finally {
    await writable.close();
  }
}

async function readFile(
  cacheType: CacheType,
  key: string
): Promise<ArrayBuffer | null> {
  try {
    const dir = await getCacheDirectory(cacheType);
    const fileName = getFileName(cacheType, key);
    const fileHandle = await dir.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return file.arrayBuffer();
  } catch {
    return null;
  }
}

async function clearDirectory(cacheType?: CacheType): Promise<void> {
  const root = await navigator.storage.getDirectory();

  try {
    const cacheRoot = await root.getDirectoryHandle(CACHE_DIR_NAME);

    if (cacheType) {
      const subDirName =
        cacheType === "video"
          ? "videos"
          : cacheType === "image"
            ? "images"
            : cacheType === "frame"
              ? "frames"
              : "filmstrips";
      await cacheRoot.removeEntry(subDirName, { recursive: true });
    } else {
      await root.removeEntry(CACHE_DIR_NAME, { recursive: true });
    }
  } catch {
    return;
  }
}

async function handleRequest(request: OPFSRequest): Promise<OPFSResponse> {
  try {
    switch (request.operation) {
      case "write":
        if (!request.key || !request.data) {
          return {
            id: request.id,
            success: false,
            error: "Missing key or data"
          };
        }
        await writeFile(request.cacheType, request.key, request.data);
        return { id: request.id, success: true };

      case "read": {
        if (!request.key) {
          return { id: request.id, success: false, error: "Missing key" };
        }
        const data = await readFile(request.cacheType, request.key);
        return {
          id: request.id,
          success: data !== null,
          data: data ?? undefined
        };
      }

      case "clear":
        await clearDirectory(
          request.cacheType === ("__all__" as CacheType)
            ? undefined
            : request.cacheType
        );
        return { id: request.id, success: true };

      default:
        return { id: request.id, success: false, error: "Unknown operation" };
    }
  } catch (error) {
    return {
      id: request.id,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

self.onmessage = async (event: MessageEvent<OPFSRequest>) => {
  const response = await handleRequest(event.data);
  self.postMessage(response);
};
