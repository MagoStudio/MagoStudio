import { atom } from "jotai";

const TOOLTIP_AUTO_HIDE_DELAY_MS = 3000;

const baseIsIteratedTooltipVisibleAtom = atom<boolean>(false);

let timeoutId: ReturnType<typeof setTimeout> | null = null;

export const isIteratedTooltipVisibleAtom = atom(
  (get) => get(baseIsIteratedTooltipVisibleAtom),
  (_get, set, newValue: boolean) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    set(baseIsIteratedTooltipVisibleAtom, newValue);

    if (newValue) {
      timeoutId = setTimeout(() => {
        set(baseIsIteratedTooltipVisibleAtom, false);
        timeoutId = null;
      }, TOOLTIP_AUTO_HIDE_DELAY_MS);
    }
  }
);
