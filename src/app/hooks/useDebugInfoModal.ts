import { debugInfoModalOpenAtom } from "@store/atoms";
import { useAtom } from "jotai";

export const useDebugInfoModal = () => {
  const [isOpen, setIsOpen] = useAtom(debugInfoModalOpenAtom);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return { isOpen, open, close, toggle };
};
