import { isNewUsersPaywallOpenAtom } from "@store/atoms";
import { useSetAtom } from "jotai";

export const useOpenNewUsersPaywall = (): (() => void) => {
  const setOpen = useSetAtom(isNewUsersPaywallOpenAtom);
  return () => setOpen(true);
};
