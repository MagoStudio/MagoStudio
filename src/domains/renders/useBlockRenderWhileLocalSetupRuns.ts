import { localSetupBlockedDialogOpenAtom } from "@store/atoms/localSetupBlockedDialogOpenAtom";
import { localSetupInProgressAtom } from "@store/atoms/localSetupInProgressAtom";
import { useAtomValue, useSetAtom } from "jotai";

/**
 * Stops a render that needs ComfyUI while the local models are still downloading,
 * and explains why.
 *
 * Every render entry point calls this rather than reading the atoms itself, so
 * a new entry point is one line and the dialog stays the only thing that has to
 * know what the setup state means. Returns whether the render was blocked.
 */

export const useBlockRenderWhileLocalSetupRuns = (): ((
  requiresComfy: boolean
) => boolean) => {
  const isLocalSetupInProgress = useAtomValue(localSetupInProgressAtom);
  const setIsLocalSetupBlockedDialogOpen = useSetAtom(
    localSetupBlockedDialogOpenAtom
  );

  return (requiresComfy) => {
    if (!requiresComfy || !isLocalSetupInProgress) return false;
    setIsLocalSetupBlockedDialogOpen(true);
    return true;
  };
};
