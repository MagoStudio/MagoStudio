import { atom } from "jotai";
import { useMemo } from "react";

import { useGlobalStorageAtom } from "../globalStore";

export function useIsSettingsEditorOpenAtom() {
  const globalStorageAtom = useGlobalStorageAtom();

  // eslint-disable-next-line no-restricted-syntax -- atom identity must be stable across renders
  return useMemo(
    () =>
      atom(
        (get) => get(globalStorageAtom).isSettingsEditorOpen,
        (get, set, isSettingsEditorOpen: boolean) => {
          set(globalStorageAtom, {
            ...get(globalStorageAtom),
            isSettingsEditorOpen
          });
        }
      ),
    [globalStorageAtom]
  );
}
