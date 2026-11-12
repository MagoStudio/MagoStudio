import { CircularProgress } from "@components/CircularProgress";
import { Icon } from "@components/Icon";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { ScriptSetupRequirement } from "../../../../desktop/shared/contracts";

import { useRequirementDownloadStatus } from "./hooks/useRequirementDownloadStatus";
import { LocalNodePackUpdateDialog } from "./LocalNodePackUpdateDialog";
import { LocalSetupCancelDownloadDialog } from "./LocalSetupCancelDownloadDialog";
import { LocalSetupDownloadProgressBar } from "./LocalSetupDownloadProgressBar";
import { LocalSetupNodePackDependenciesNote } from "./LocalSetupNodePackDependenciesNote";

export const LocalSetupRequirementDownload = ({
  item,
  startDownloadOnceLicensesAccepted,
  onNodePackInstalled,
  onModelSaved
}: {
  item: ScriptSetupRequirement;
  startDownloadOnceLicensesAccepted: (
    startDownload: () => void
  ) => Promise<void>;
  onNodePackInstalled?: () => void;
  onModelSaved?: () => void;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const download = useMutation({
    mutationFn: (replaceExistingNodePackIn?: string) =>
      window.mago.localSetup.downloadRequirement(item.name, {
        replaceExistingNodePackIn
      }),
    onSuccess: (result) => {
      const isNodePackLoadableAfterRestart =
        result?.outcome === "saved" &&
        item.installKind === "node" &&
        result.nodePackDependencies?.outcome !== "manual";
      if (isNodePackLoadableAfterRestart) onNodePackInstalled?.();
      const isModelSaved =
        result?.outcome === "saved" && item.installKind === "model";
      if (isModelSaved) onModelSaved?.();
    }
  });
  const savedDownload =
    download.data?.outcome === "saved" ? download.data : null;
  const isNodePackReadyToLoad =
    savedDownload !== null &&
    item.installKind === "node" &&
    savedDownload.nodePackDependencies?.outcome !== "manual";
  const nodePackUpdateAwaitingConfirmation =
    download.data?.outcome === "node-pack-update-needs-confirmation"
      ? download.data
      : null;
  const requestDownload = useMutation({
    mutationFn: async () => {
      if (item.installKind !== "model") return download.mutate(undefined);
      await startDownloadOnceLicensesAccepted(() => download.mutate(undefined));
    }
  });
  const trackedDownload = useRequirementDownloadStatus(
    item.name,
    download.isPending
  );
  const isDownloadRunning =
    download.isPending || trackedDownload?.phase === "downloading";
  const isDownloadInterrupted =
    !isDownloadRunning &&
    (download.isError ||
      trackedDownload?.phase === "paused" ||
      trackedDownload?.phase === "error");
  const downloadFailureMessage =
    download.error?.message ??
    (trackedDownload?.phase === "error" ? trackedDownload.error : null);
  const isDownloadProgressKnown =
    (isDownloadRunning || isDownloadInterrupted) &&
    !!trackedDownload?.totalBytes;
  const cancelDownload = useMutation({
    mutationFn: () => window.mago.localSetup.cancelDownload(item.name),
    onSettled: async () => {
      setIsCancelDialogOpen(false);
      download.reset();
      await queryClient.invalidateQueries({
        queryKey: ["requirement-download-status", item.name]
      });
    }
  });
  const canCancelDownload = isDownloadRunning || isDownloadInterrupted;
  if (!item.downloadUrl) return null;
  return (
    <div className="flex flex-col items-start gap-1 self-stretch">
      {isDownloadProgressKnown && (
        <div className="flex w-full flex-col gap-1">
          <LocalSetupDownloadProgressBar
            receivedBytes={trackedDownload.downloadedBytes}
            totalBytes={trackedDownload.totalBytes ?? 0}
          />
        </div>
      )}
      {!isNodePackReadyToLoad && (
        <div className="flex flex-wrap items-center gap-2">
          <MainButton
            startIcon={
              isDownloadRunning ? (
                <CircularProgress size="sm" />
              ) : (
                <Icon iconSet="16" iconName="download" />
              )
            }
            colorScheme="secondary"
            isDisabled={isDownloadRunning || requestDownload.isPending}
            onPress={() => requestDownload.mutate()}
          >
            {isDownloadRunning
              ? t("localSetup.requirementDownload.downloading")
              : isDownloadInterrupted
                ? t("localSetup.requirementDownload.resume")
                : item.installKind === "node"
                  ? t("localSetup.requirementDownload.downloadAndInstall")
                  : t("localSetup.requirementDownload.download")}
          </MainButton>
          {isDownloadRunning && (
            <MainButton
              colorScheme="secondary"
              onPress={() => {
                void window.mago.localSetup.pauseDownload(item.name);
              }}
            >
              {t("localSetup.requirementDownload.pause")}
            </MainButton>
          )}
          {canCancelDownload && (
            <MainButton
              colorScheme="secondary"
              isDisabled={cancelDownload.isPending}
              onPress={() => setIsCancelDialogOpen(true)}
            >
              {t("localSetup.requirementDownload.cancel")}
            </MainButton>
          )}
        </div>
      )}
      {isDownloadInterrupted && downloadFailureMessage && (
        <Text variant="xs" color="glyph-error">
          {downloadFailureMessage}
        </Text>
      )}
      {requestDownload.isError && (
        <Text variant="xs" color="glyph-error">
          {requestDownload.error.message}
        </Text>
      )}
      {savedDownload && (
        <Text variant="xs" color="success">
          {t(
            item.installKind === "node"
              ? "localSetup.requirementDownload.savedNodePack"
              : "localSetup.requirementDownload.savedModel",
            { savedTo: savedDownload.savedTo }
          )}
        </Text>
      )}
      {savedDownload?.nodePackDependencies && (
        <LocalSetupNodePackDependenciesNote
          nodePackDependencies={savedDownload.nodePackDependencies}
        />
      )}
      {isNodePackReadyToLoad && (
        <Text variant="xs" color="glyph-warning">
          {t("localSetup.comfyRestart.waitingForRestart")}
        </Text>
      )}
      <LocalSetupCancelDownloadDialog
        isOpen={isCancelDialogOpen}
        filename={item.name}
        isDeleting={cancelDownload.isPending}
        onBack={() => setIsCancelDialogOpen(false)}
        onDelete={() => cancelDownload.mutate()}
      />
      <LocalNodePackUpdateDialog
        nodePackDirectory={
          nodePackUpdateAwaitingConfirmation?.nodePackDirectory ?? null
        }
        backupsFolder={nodePackUpdateAwaitingConfirmation?.backupsFolder ?? ""}
        onCancel={() => download.reset()}
        onConfirm={() =>
          download.mutate(nodePackUpdateAwaitingConfirmation?.customNodesFolder)
        }
      />
    </div>
  );
};
