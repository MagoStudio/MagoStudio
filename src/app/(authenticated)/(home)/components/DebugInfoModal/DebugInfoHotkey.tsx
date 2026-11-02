import { useDebugInfoModal } from "@hooks/useDebugInfoModal";
import { useHotkeys } from "react-hotkeys-hook";

export function DebugInfoHotkey() {
  const { toggle } = useDebugInfoModal();

  useHotkeys("mod+shift+d", toggle, {
    preventDefault: true
  });

  return null;
}
