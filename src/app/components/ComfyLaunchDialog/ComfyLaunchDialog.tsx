import {
  COMFY_LAUNCH_STATUS_QUERY_KEY,
  useComfyLaunchStatus
} from "@app/components/LaunchComfyButton/hooks/useComfyLaunchStatus";
import { useOpenLocalSetupWizard } from "@app/components/LocalSetupWizard/hooks/useOpenLocalSetupWizard";
import { LocalSetupStatusMark } from "@app/components/LocalSetupWizard/LocalSetupStatusMark";
import { refreshModelSettings } from "@app/components/LocalSetupWizard/utils/refreshModelSettings";
import { useMountEffect } from "@app/hooks/useMountEffect";
import { CircularProgress } from "@components/CircularProgress";
import { MainButton } from "@components/MainButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import { useQueryClient } from "@tanstack/react-query";
import { Heading } from "react-aria-components/Dialog";
import { useTranslation } from "react-i18next";

import { ComfyLaunchProgress } from "./ComfyLaunchProgress";
import { useComfyLaunchAttempt } from "./hooks/useComfyLaunchAttempt";
import { COMFY_LAUNCH_TIMEOUT_MS } from "./utils/waitForComfyToRespond";

const MILLISECONDS_PER_MINUTE = 60_000;

export const ComfyLaunchDialog = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openLocalSetupWizardAfterClosing = useOpenLocalSetupWizard();
  const comfyLaunchStatus = useComfyLaunchStatus();
  const { attempt, start, cancel } = useComfyLaunchAttempt({
    onComfyResponded: (comfyStatus) => {
      queryClient.setQueryData(COMFY_LAUNCH_STATUS_QUERY_KEY, comfyStatus);
      void refreshModelSettings(queryClient);
      void queryClient.invalidateQueries({ queryKey: ["local-video-setup"] });
      void queryClient.invalidateQueries({ queryKey: ["local-script-setup"] });
      onClose();
    }
  });

  useMountEffect(() => {
    void start();
    return cancel;
  });

  const cancelAndClose = () => {
    cancel();
    onClose();
  };

  const openLocalSetupWizard = () => {
    cancelAndClose();
    openLocalSetupWizardAfterClosing();
  };

  const launchPath = comfyLaunchStatus.data?.launchPath;

  return (
    <OverlayDialog
      isOpen
      onOpenChange={(nextIsOpen) => {
        if (!nextIsOpen) cancelAndClose();
      }}
      size={{ mode: "hug", maxWidthPx: 460 }}
    >
      <div
        className="flex w-full flex-col gap-6 p-6"
        data-testid="comfy-launch-dialog"
      >
        {attempt.phase === "launching" ? (
          <>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <CircularProgress
                  size="sm"
                  color="glyph-primary"
                  aria-hidden="true"
                />
                <Heading slot="title" className="contents">
                  <Text component="span" variant="lg" weight="semibold">
                    {t("localSetup.comfyLaunch.dialog.launchingTitle")}
                  </Text>
                </Heading>
              </div>
              <Text variant="sm" color="glyph-secondary" lineHeight="relaxed">
                {t("localSetup.comfyLaunch.dialog.launchingDescription")}
              </Text>
              {launchPath && (
                <Text
                  variant="xs"
                  color="glyph-secondary"
                  className="select-text break-all rounded-lg bg-surface-primary px-2.5 py-2"
                >
                  {launchPath}
                </Text>
              )}
              <ComfyLaunchProgress
                startedAtMs={attempt.startedAtMs}
                checkCount={attempt.checkCount}
                lastCheckAtMs={attempt.lastCheckAtMs}
              />
            </div>
            <div className="flex justify-end">
              <MainButton colorScheme="secondary" onPress={cancelAndClose}>
                {t("localSetup.comfyLaunch.dialog.cancel")}
              </MainButton>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3" role="alert">
              <div className="flex items-center gap-3">
                <LocalSetupStatusMark outcome="error" />
                <Heading slot="title" className="contents">
                  <Text component="span" variant="lg" weight="semibold">
                    {t("localSetup.comfyLaunch.dialog.failedTitle")}
                  </Text>
                </Heading>
              </div>
              <Text variant="sm" color="glyph-secondary" lineHeight="relaxed">
                {attempt.failureReason === "timed-out" &&
                  t("localSetup.comfyLaunch.dialog.timedOutDescription", {
                    minutes: COMFY_LAUNCH_TIMEOUT_MS / MILLISECONDS_PER_MINUTE
                  })}
                {attempt.failureReason === "launched-process-exited" &&
                  t("localSetup.comfyLaunch.launchedProcessExited", {
                    exitCode:
                      attempt.exitCode ??
                      t("localSetup.comfyLaunch.unknownExitCode")
                  })}
                {attempt.failureReason === "launch-error" &&
                  t("localSetup.comfyLaunch.dialog.launchErrorDescription")}
              </Text>
              {attempt.failureReason === "launched-process-exited" &&
                attempt.reportedFailureReason && (
                  <Text
                    variant="sm"
                    color="glyph-error"
                    className="select-text break-words"
                  >
                    {t("localSetup.comfyLaunch.reportedFailureReason", {
                      reason: attempt.reportedFailureReason
                    })}
                  </Text>
                )}
              {attempt.failureReason === "launch-error" && (
                <Text variant="sm" color="glyph-error" className="break-words">
                  {attempt.errorMessage}
                </Text>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <MainButton colorScheme="secondary" onPress={cancelAndClose}>
                {t("localSetup.comfyLaunch.dialog.cancel")}
              </MainButton>
              <MainButton
                colorScheme="secondary"
                onPress={() => void start({ restartUnresponsiveProcess: true })}
              >
                {t("localSetup.comfyLaunch.dialog.retry")}
              </MainButton>
              <MainButton
                colorScheme="primary"
                onPress={() => openLocalSetupWizard()}
              >
                {t("localSetup.setupMagoStudio.label")}
              </MainButton>
            </div>
          </>
        )}
      </div>
    </OverlayDialog>
  );
};
