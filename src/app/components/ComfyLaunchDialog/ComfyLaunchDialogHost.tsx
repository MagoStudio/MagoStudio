import { comfyLaunchDialogOpenAtom } from "@store/atoms/comfyLaunchDialogOpenAtom";
import { useAtom } from "jotai";

import { ComfyLaunchDialog } from "./ComfyLaunchDialog";

export const ComfyLaunchDialogHost = () => {
  const [isComfyLaunchDialogOpen, setIsComfyLaunchDialogOpen] = useAtom(
    comfyLaunchDialogOpenAtom
  );
  if (!isComfyLaunchDialogOpen) return null;
  return (
    <ComfyLaunchDialog onClose={() => setIsComfyLaunchDialogOpen(false)} />
  );
};
