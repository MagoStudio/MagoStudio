import { resolveStorageScopeParts, StorageScope } from "./storageScope";

export const buildUserScopedStorageKey = (
  name: string,
  scope: StorageScope
): string | undefined => {
  const scopeParts = resolveStorageScopeParts(scope);

  if (!scopeParts) {
    return undefined;
  }

  const [userId, ...projectAndShotParts] = scopeParts;

  if (userId === undefined) {
    return name;
  }

  return [userId, name, ...projectAndShotParts].join(":");
};
