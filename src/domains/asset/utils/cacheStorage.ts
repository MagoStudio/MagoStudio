import {
  isOPFSSupported,
  opfsClear,
  opfsGet,
  opfsSet,
  type CacheType
} from "./opfs";
import {
  handleQuotaExceeded,
  isQuotaExceededError
} from "./opfs/quotaManagement";

export type { CacheType } from "./opfs";

export async function cacheClear(type?: CacheType): Promise<void> {
  const useOPFS = await isOPFSSupported();
  if (!useOPFS) return;

  try {
    await opfsClear(type);
  } catch (error) {
    console.warn("OPFS clear failed:", error);
  }
}

export async function cacheSet(
  type: CacheType,
  key: string,
  blob: Blob
): Promise<void> {
  const useOPFS = await isOPFSSupported();
  if (!useOPFS) return;

  try {
    await opfsSet(type, key, blob);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      await handleQuotaExceeded();
      await opfsSet(type, key, blob);
    } else {
      console.warn("OPFS write failed:", error);
    }
  }
}

export async function cacheGet(
  type: CacheType,
  key: string
): Promise<Blob | undefined> {
  const useOPFS = await isOPFSSupported();
  if (!useOPFS) return undefined;

  try {
    return await opfsGet(type, key);
  } catch (error) {
    console.warn("OPFS read failed:", error);
    return undefined;
  }
}
