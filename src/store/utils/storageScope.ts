export type StorageScope =
  | { level: "device" }
  | { level: "user"; userId: string | undefined }
  | {
      level: "project";
      userId: string | undefined;
      projectId: string | undefined;
    }
  | {
      level: "shot";
      userId: string | undefined;
      projectId: string | undefined;
      shotId: string | undefined;
    };

export const UNRESOLVED_SCOPE_KEY_PREFIX = "unresolved-scope:";

const isPresentIdentifier = (part: string | undefined): part is string =>
  !!part;

export const resolveStorageScopeParts = (
  scope: StorageScope
): string[] | undefined => {
  if (scope.level === "device") {
    return [];
  }

  const orderedIdentifiers =
    scope.level === "user"
      ? [scope.userId]
      : scope.level === "project"
        ? [scope.userId, scope.projectId]
        : [scope.userId, scope.projectId, scope.shotId];

  const presentIdentifiers = orderedIdentifiers.filter(isPresentIdentifier);

  if (presentIdentifiers.length !== orderedIdentifiers.length) {
    return undefined;
  }

  return presentIdentifiers;
};
