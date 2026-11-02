import { useUser } from "@platform/identity";
import { buildUserScopedStorageKey } from "@store/utils/buildUserScopedStorageKey";
import { UNRESOLVED_SCOPE_KEY_PREFIX } from "@store/utils/storageScope";
import { useLocalStorage } from "usehooks-ts";

export type UserLocalStorageScope =
  | { level: "user" }
  | { level: "project"; projectId: string | undefined }
  | {
      level: "shot";
      projectId: string | undefined;
      shotId: string | undefined;
    };

export function useUserLocalStorage<T>(
  name: string,
  defaultValue: T,
  scope: UserLocalStorageScope = { level: "user" }
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const { user } = useUser();

  const scopedStorageKey = buildUserScopedStorageKey(
    name,
    scope.level === "user"
      ? { level: "user", userId: user?.id }
      : scope.level === "project"
        ? { level: "project", userId: user?.id, projectId: scope.projectId }
        : {
            level: "shot",
            userId: user?.id,
            projectId: scope.projectId,
            shotId: scope.shotId
          }
  );

  const isScopeResolved = scopedStorageKey !== undefined;

  const [value, setValue] = useLocalStorage<T>(
    scopedStorageKey ?? `${UNRESOLVED_SCOPE_KEY_PREFIX}${name}`,
    defaultValue
  );

  const setValueWhenScopeResolved = (newValue: T | ((prev: T) => T)) => {
    if (!isScopeResolved) {
      return;
    }
    setValue(newValue);
  };

  return [value, setValueWhenScopeResolved, isScopeResolved];
}
