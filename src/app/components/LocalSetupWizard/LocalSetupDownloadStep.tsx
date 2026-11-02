import { LaunchComfyButton } from "@app/components/LaunchComfyButton";
import { useComfyLaunchStatus } from "@app/components/LaunchComfyButton/hooks/useComfyLaunchStatus";
import { COMFY_LAUNCH_MUTATION_KEY } from "@app/components/LaunchComfyButton/hooks/useLaunchComfy";
import { Accordion } from "@components/Accordion";
import { LinearProgress } from "@components/LinearProgress";
import { MainButton } from "@components/MainButton";
import { Modal } from "@components/Modal";
import { Text } from "@components/Text";
import { useMutationState } from "@tanstack/react-query";
import { useState } from "react";
import { Link as AriaLink } from "react-aria-components/Link";
import { useTranslation } from "react-i18next";

import type { StarterInstallStatus } from "../../../../desktop/shared/contracts";

import { LocalSetupComfyRestartPrompt } from "./LocalSetupComfyRestartPrompt";
import { LocalSetupDownloadFileRow } from "./LocalSetupDownloadFileRow";
import { LocalSetupWizardCard } from "./LocalSetupWizardCard";
const BYTES_PER_GIB = 1_073_741_824;
export const LocalSetupDownloadStep = ({
  status,
  error,
  onPause,
  onResume,
  onCancel,
  onExplore,
  onFinish
}: {
  status?: StarterInstallStatus;
  error: string | null;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => Promise<void>;
  onExplore: () => void;
  onFinish: () => void;
}) => {
  const { t } = useTranslation();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isFileListExpanded, setIsFileListExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const cancel = async () => {
    setCancelling(true);
    try {
      await onCancel();
      setConfirmCancel(false);
    } finally {
      setCancelling(false);
    }
  };
  const files = status?.files ?? [];
  const total = files.reduce((sum, file) => sum + file.bytes, 0);
  const received = files.reduce(
    (sum, file) => sum + Math.min(file.bytes, file.downloadedBytes),
    0
  );
  const paused = status?.phase === "paused" || status?.phase === "error";
  const done = status?.phase === "done";
  const comfyLaunchStatus = useComfyLaunchStatus({
    isComfyLaunchStatusNeeded: done
  });
  const isComfyRunning = comfyLaunchStatus.data?.available === true;
  const isComfyLauncherUnknown = comfyLaunchStatus.data?.canLaunch === false;
  const isComfyLaunchStatusUnreadable = comfyLaunchStatus.isError;
  const hasComfyLaunchFailed =
    useMutationState({
      filters: { mutationKey: COMFY_LAUNCH_MUTATION_KEY, status: "error" }
    }).length > 0;
  const canFinishSetup =
    isComfyRunning ||
    isComfyLauncherUnknown ||
    isComfyLaunchStatusUnreadable ||
    hasComfyLaunchFailed;
  const completedFileCount = files.filter(
    (file) => file.state === "done"
  ).length;
  return (
    <LocalSetupWizardCard>
      <Text variant="lg">
        {done
          ? "ComfyUI and models installed"
          : status?.phase === "extracting"
            ? "Extracting ComfyUI..."
            : status?.phase === "installing-dependencies"
              ? t("localSetup.download.installingDependencies")
              : status?.phase === "verifying"
                ? "Verifying downloaded files..."
                : paused
                  ? "Download paused"
                  : "Downloading ComfyUI and models"}
      </Text>
      <LinearProgress
        size="lg"
        value={received}
        totalValue={Math.max(total, 1)}
        color="element-additional-active"
        className="min-w-0 flex-none rounded-full bg-element-tertiary"
      />
      <Text variant="sm" color="glyph-secondary">
        {(received / BYTES_PER_GIB).toFixed(1)} of{" "}
        {(total / BYTES_PER_GIB).toFixed(1)} GB
      </Text>
      {status?.phase === "extracting" && (
        <Text variant="xs" color="glyph-secondary" decoration="underline">
          Extracting into {status.directory}
        </Text>
      )}
      {(error || status?.error) && (
        <Text variant="sm" color="glyph-error">
          {error ?? status?.error}
        </Text>
      )}
      <Accordion
        label={`Download details (${completedFileCount}/${files.length} files)`}
        isExpanded={isFileListExpanded}
        onExpandedChange={setIsFileListExpanded}
      >
        <div className="flex max-h-64 flex-col overflow-y-auto pr-1 scrollbar-custom">
          {files.map((file) => (
            <LocalSetupDownloadFileRow
              key={file.destination}
              file={file}
              isDownloadPaused={paused}
            />
          ))}
        </div>
      </Accordion>
      {done && status?.isComfyRestartNeeded && <LocalSetupComfyRestartPrompt />}
      {done ? (
        <Text variant="sm" color="glyph-tertiary">
          Launch ComfyUI to start using the installed models.
        </Text>
      ) : (
        <Text variant="xs" color="glyph-secondary">
          Paused or failed downloads can resume. Completed models are verified
          with SHA-256; the ComfyUI archive is verified before extraction.
        </Text>
      )}
      {!done && (
        <AriaLink
          onPress={onExplore}
          className="cursor-pointer text-sm text-glyph-action-main underline"
        >
          Explore Mago while you wait
        </AriaLink>
      )}
      <div className="flex gap-2">
        {done ? (
          <div className="flex w-full flex-col gap-2">
            <LaunchComfyButton />
            {canFinishSetup && (
              <MainButton fullWidth colorScheme="primary" onPress={onFinish}>
                Finish
              </MainButton>
            )}
          </div>
        ) : (
          <MainButton
            fullWidth
            colorScheme="primary"
            isDisabled={cancelling}
            onPress={paused ? onResume : onPause}
          >
            {paused ? "Resume / retry" : "Pause"}
          </MainButton>
        )}
        {!done && (
          <MainButton
            fullWidth
            colorScheme="secondary"
            isDisabled={cancelling}
            onPress={() => setConfirmCancel(true)}
          >
            Cancel
          </MainButton>
        )}
      </div>
      <Modal
        open={confirmCancel}
        onClose={() => {
          if (!cancelling) setConfirmCancel(false);
        }}
        width="sm"
        title="Cancel installation?"
      >
        <div className="flex flex-col gap-5">
          <Text variant="sm">
            This stops the installation and returns to setup. Downloaded files
            are kept so you can resume later by choosing the same folder.
          </Text>
          <div className="flex gap-2">
            <MainButton
              colorScheme="secondary"
              isDisabled={cancelling}
              onPress={() => setConfirmCancel(false)}
            >
              Keep installing
            </MainButton>
            <MainButton
              colorScheme="danger"
              isDisabled={cancelling}
              loading={cancelling}
              onPress={() => void cancel()}
            >
              Cancel installation
            </MainButton>
          </div>
        </div>
      </Modal>
    </LocalSetupWizardCard>
  );
};
