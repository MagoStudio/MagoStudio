import { resolveStorageScopeParts, StorageScope } from "./storageScope";

export const buildPrefixedStorageKey = (
  prefix: string,
  scope: StorageScope
): string | undefined => {
  const scopeParts = resolveStorageScopeParts(scope);

  if (!scopeParts) {
    return undefined;
  }

  return [prefix, ...scopeParts].join("-");
};
