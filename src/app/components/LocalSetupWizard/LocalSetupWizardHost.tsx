/* oxlint-disable custom-react/no-use-effect -- publishes wizard progress to the store that the render surfaces read */
import { useMountEffect } from "@hooks/useMountEffect";
import { localSetupInProgressAtom } from "@store/atoms/localSetupInProgressAtom";
import { localSetupWizardCollapsedAtom } from "@store/atoms/localSetupWizardCollapsedAtom";
import { localSetupWizardOpenAtom } from "@store/atoms/localSetupWizardOpenAtom";
import { cn } from "@utils";
import { useAtom, useSetAtom } from "jotai";
import { useEffect, useState } from "react";

import { useLocalSetupWizardFlow } from "./hooks/useLocalSetupWizardFlow";
import { LocalSetupCollapsedPill } from "./LocalSetupCollapsedPill";
import { LocalSetupWizard } from "./LocalSetupWizard";
import {
  consumeLocalSetupWizardRequest,
  OPEN_LOCAL_SETUP_EVENT,
  readLocalSetupOpenRequest
} from "./localSetupWizardHandoff";
import { isStarterInstallRunning } from "./utils/isStarterInstallRunning";

/**
 * Mounts the local setup wizard over a running app rather than in place of it.
 *
 * Skipping sign-in persists offline mode and rebuilds the window, so by the
 * time the wizard appears the app behind it is real and usable. The wrapper
 * takes no pointer events, which is what keeps the rest of the interface
 * clickable while setup is open.
 *
 * The panel sits in the centre of the screen and collapses to a pill in the
 * bottom-right corner.
 *
 * The scrim dims the app without capturing clicks: it inherits the wrapper's
 * pointer-events, so the interface behind it stays usable. Collapsing to the
 * pill removes it, because at that point the user is working in the app.
 */

const PERCENTAGE_SCALE = 100;

export const LocalSetupWizardHost = () => {
  const flow = useLocalSetupWizardFlow();
  const [isOpen, setIsOpen] = useAtom(localSetupWizardOpenAtom);
  const [isCollapsed, setIsCollapsed] = useAtom(localSetupWizardCollapsedAtom);
  const [isExistingComfyDialogOpen, setIsExistingComfyDialogOpen] =
    useState(false);

  const setIsLocalSetupInProgress = useSetAtom(localSetupInProgressAtom);

  useMountEffect(() => {
    if (consumeLocalSetupWizardRequest()) setIsOpen(true);
    const expandAndApplyOpenRequest = (event: Event) => {
      setIsCollapsed(false);
      const openRequest = readLocalSetupOpenRequest(event);
      if (!openRequest) return;
      const applyOpenRequest = () => {
        if (openRequest.kind === "manual-download")
          setIsExistingComfyDialogOpen(true);
        else flow.startUpdateInstallation(openRequest.preselectedModelGroupIds);
      };
      void window.mago.localSetup
        .installerStatus()
        .then((installerStatus) => {
          if (!isStarterInstallRunning(installerStatus)) applyOpenRequest();
        })
        .catch(applyOpenRequest);
    };
    window.addEventListener(OPEN_LOCAL_SETUP_EVENT, expandAndApplyOpenRequest);
    return () =>
      window.removeEventListener(
        OPEN_LOCAL_SETUP_EVENT,
        expandAndApplyOpenRequest
      );
  });

  useEffect(() => {
    setIsLocalSetupInProgress(
      isOpen && flow.state.step === "download" && flow.state.outcome !== "done"
    );
  }, [isOpen, flow.state, setIsLocalSetupInProgress]);

  if (!isOpen) return null;

  const downloadPercentage =
    flow.state.step === "download"
      ? Math.round(
          (flow.installer
            ? flow.installer.files.reduce(
                (sum, file) => sum + Math.min(file.bytes, file.downloadedBytes),
                0
              ) /
              Math.max(
                1,
                flow.installer.files.reduce((sum, file) => sum + file.bytes, 0)
              )
            : 0) * PERCENTAGE_SCALE
        )
      : undefined;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-modal flex p-4",
        isCollapsed ? "items-end justify-end" : "items-center justify-center"
      )}
    >
      {isCollapsed ? null : (
        <div className="absolute inset-0 bg-surface-modal-backdrop" />
      )}

      <div className="pointer-events-auto">
        {isCollapsed ? (
          <LocalSetupCollapsedPill
            percentage={downloadPercentage}
            onExpand={() => setIsCollapsed(false)}
          />
        ) : (
          <LocalSetupWizard
            flow={flow}
            onClose={() => setIsOpen(false)}
            onUseCloud={() => void window.mago?.account?.signOut()}
            onCollapse={() => setIsCollapsed(true)}
            isExistingComfyDialogOpen={isExistingComfyDialogOpen}
            onOpenExistingComfyDialog={() => setIsExistingComfyDialogOpen(true)}
            onCloseExistingComfyDialog={() =>
              setIsExistingComfyDialogOpen(false)
            }
          />
        )}
      </div>
    </div>
  );
};
