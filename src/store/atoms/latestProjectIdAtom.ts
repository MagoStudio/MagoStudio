import { useUser } from "@clerk/react";

import { buildUserScopedStorageKey } from "../utils/buildUserScopedStorageKey";
import { createScopedStorageAtomCache } from "../utils/createScopedStorageAtomCache";

const browserSessionStorage = {
  getItem: (key: string, initialValue: string | null) => {
    if (typeof window === "undefined") return initialValue;
    return window.sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string | null) => {
    if (typeof window === "undefined") return;
    if (value === null || value === "null") {
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(key);
  }
};

const getLatestProjectIdStorageAtom = createScopedStorageAtomCache<
  string | null
>({ defaultValue: null, storage: browserSessionStorage });

export function useLatestProjectIdAtom() {
  const { user } = useUser();

  return getLatestProjectIdStorageAtom(
    buildUserScopedStorageKey("latestProjectId", {
      level: "user",
      userId: user?.id
    })
  );
}
