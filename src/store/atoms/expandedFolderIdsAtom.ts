import { atom } from "jotai";
import { useMemo } from "react";

import { useGlobalStorageAtom } from "../globalStore";

type SetStateAction<T> = T | ((prev: T) => T);

export function useExpandedFolderIdsAtom() {
  const globalStorageAtom = useGlobalStorageAtom();

  // eslint-disable-next-line no-restricted-syntax -- atom identity must be stable across renders
  return useMemo(
    () =>
      atom(
        (get) => get(globalStorageAtom).expandedFolderIds ?? [],
        (get, set, value: SetStateAction<string[]>) => {
          const globalState = get(globalStorageAtom);
          const currentExpandedFolderIds = globalState.expandedFolderIds ?? [];
          set(globalStorageAtom, {
            ...globalState,
            expandedFolderIds:
              typeof value === "function"
                ? value(currentExpandedFolderIds)
                : value
          });
        }
      ),
    [globalStorageAtom]
  );
}
