import { atom } from "jotai";
import { useMemo } from "react";

import { useGlobalStorageAtom } from "../globalStore";

export type SortBy = "alphabetical" | "lastEdited";
export type SortDirection = "asc" | "desc";

export function useProjectSortByAtom() {
  const globalStorageAtom = useGlobalStorageAtom();

  // eslint-disable-next-line no-restricted-syntax -- atom identity must be stable across renders
  return useMemo(
    () =>
      atom(
        (get) => get(globalStorageAtom).projectSortBy ?? "lastEdited",
        (get, set, projectSortBy: SortBy) => {
          set(globalStorageAtom, { ...get(globalStorageAtom), projectSortBy });
        }
      ),
    [globalStorageAtom]
  );
}

export function useProjectSortDirectionAtom() {
  const globalStorageAtom = useGlobalStorageAtom();

  // eslint-disable-next-line no-restricted-syntax -- atom identity must be stable across renders
  return useMemo(
    () =>
      atom(
        (get) => get(globalStorageAtom).projectSortDirection ?? "desc",
        (get, set, projectSortDirection: SortDirection) => {
          set(globalStorageAtom, {
            ...get(globalStorageAtom),
            projectSortDirection
          });
        }
      ),
    [globalStorageAtom]
  );
}
