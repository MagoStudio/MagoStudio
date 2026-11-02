import { atom } from "jotai";

const INFOBLOCK_AUTO_HIDE_DELAY_MS = 1000;

const baseIsSettingsPastedInfoBlockVisibleAtom = atom<boolean>(false);

let timeoutId: ReturnType<typeof setTimeout> | null = null;

export const isSettingsPastedInfoBlockVisibleAtom = atom(
  (get) => get(baseIsSettingsPastedInfoBlockVisibleAtom),
  (_get, set, newValue: boolean) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    set(baseIsSettingsPastedInfoBlockVisibleAtom, newValue);

    if (newValue) {
      timeoutId = setTimeout(() => {
        set(baseIsSettingsPastedInfoBlockVisibleAtom, false);
        timeoutId = null;
      }, INFOBLOCK_AUTO_HIDE_DELAY_MS);
    }
  }
);
