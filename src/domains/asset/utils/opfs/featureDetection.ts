let opfsSupportedCache: boolean | null = null;

export async function isOPFSSupported(): Promise<boolean> {
  if (opfsSupportedCache !== null) {
    return opfsSupportedCache;
  }

  if (typeof window === "undefined") {
    opfsSupportedCache = false;
    return false;
  }

  try {
    if (!navigator.storage?.getDirectory) {
      opfsSupportedCache = false;
      return false;
    }

    const root = await navigator.storage.getDirectory();
    const testFileName = ".opfs-support-test";
    const testFile = await root.getFileHandle(testFileName, { create: true });
    await root.removeEntry(testFileName);

    if (!testFile) {
      opfsSupportedCache = false;
      return false;
    }

    opfsSupportedCache = true;
    return true;
  } catch {
    opfsSupportedCache = false;
    return false;
  }
}
