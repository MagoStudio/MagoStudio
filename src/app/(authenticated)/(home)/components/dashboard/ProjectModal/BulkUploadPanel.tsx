/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { GhostButton } from "@components/GhostButton";
import { LinearProgress } from "@components/LinearProgress";
import { MainButton } from "@components/MainButton";
import { Modal } from "@components/Modal";
import { Text } from "@components/Text";
import { useBulkUpload } from "@domains/bulkUpload/useBulkUpload";
import { bulkUploadAtom } from "@store/atoms";
import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { BulkUploadFileRow } from "./BulkUploadFileRow";

const FULL_PROGRESS = 100;

interface Props {
  projectId: string | undefined;
}

export const BulkUploadPanel: React.FC<Props> = ({ projectId }) => {
  const bulkUploadState = useAtomValue(bulkUploadAtom);
  const { cancelPendingUpload, cancelAllUploads, hideBulkUploadPanel } =
    useBulkUpload(projectId);
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const wasActiveRef = useRef(bulkUploadState.isUploadInProgress);

  useEffect(() => {
    if (wasActiveRef.current && !bulkUploadState.isUploadInProgress) {
      const hasErrors = bulkUploadState.files.some((f) => f.status === "error");
      if (!hasErrors) {
        hideBulkUploadPanel();
      }
    }
    wasActiveRef.current = bulkUploadState.isUploadInProgress;
  }, [
    bulkUploadState.isUploadInProgress,
    bulkUploadState.files,
    hideBulkUploadPanel
  ]);

  if (!bulkUploadState.isPanelVisible) return null;

  const totalCount = bulkUploadState.files.length;
  const completedCount = bulkUploadState.files.filter(
    (f) => f.status === "completed"
  ).length;
  const errorCount = bulkUploadState.files.filter(
    (f) => f.status === "error"
  ).length;

  const overallProgress =
    totalCount > 0
      ? Math.round(
          bulkUploadState.files.reduce((sum, f) => {
            if (f.status === "completed") return sum + FULL_PROGRESS;
            if (f.status === "error" || f.status === "cancelled")
              return sum + FULL_PROGRESS;
            return sum + f.progress;
          }, 0) / totalCount
        )
      : 0;

  return (
    <>
      <div
        className="group relative mx-2 mb-4 mr-6 shrink-0 overflow-hidden rounded-lg bg-surface-secondary-opacity-90 px-3 pb-5 pt-3 shadow-modal backdrop-blur-[50px]"
        style={{ border: "0.5px solid var(--color-glyph-stroke)" }}
      >
        <div className="flex items-center justify-between">
          <Text variant="sm" weight="bold" color="glyph-primary">
            {bulkUploadState.isUploadInProgress
              ? t("bulk_upload.uploading_title.label", { total: totalCount })
              : t("bulk_upload.complete.label")}
          </Text>
          <GhostButton
            className="opacity-0 transition-opacity group-hover:opacity-100"
            onPress={
              bulkUploadState.isUploadInProgress
                ? cancelAllUploads
                : hideBulkUploadPanel
            }
          >
            {bulkUploadState.isUploadInProgress
              ? t("bulk_upload.cancel_all.label")
              : t("bulk_upload.hide.label")}
          </GhostButton>
        </div>

        <Text variant="xs" color="glyph-primary">
          {!bulkUploadState.isUploadInProgress && errorCount > 0
            ? t("bulk_upload.done_count_with_errors.label", {
                completed: completedCount,
                total: totalCount,
                errors: errorCount
              })
            : t("bulk_upload.done_count.label", {
                completed: completedCount,
                total: totalCount
              })}
        </Text>

        <MainButton
          variant="outlined"
          colorScheme="onColor"
          className="mt-4"
          onPress={() => setIsExpanded(true)}
        >
          {t("bulk_upload.see_progress.label")}
        </MainButton>

        <LinearProgress
          value={overallProgress}
          totalValue={100}
          size="sm"
          color="glyph-success"
          className="!absolute bottom-0 left-0 !min-w-0 !bg-transparent"
        />
      </div>

      <Modal
        open={isExpanded}
        onClose={() => setIsExpanded(false)}
        showCloseButton={false}
        width="md"
        className="z-nested-modal"
      >
        <div className="flex min-h-[170px] max-h-[760px] flex-col gap-3">
          <div className="flex items-center justify-between">
            <Text variant="md" weight="bold" color="glyph-primary">
              {bulkUploadState.isUploadInProgress
                ? t("bulk_upload.uploading_title.label", { total: totalCount })
                : t("bulk_upload.complete.label")}
            </Text>
            <GhostButton onPress={() => setIsExpanded(false)}>
              {t("bulk_upload.hide.label")}
            </GhostButton>
          </div>

          <Text variant="2xs" color="glyph-primary">
            {!bulkUploadState.isUploadInProgress && errorCount > 0
              ? t("bulk_upload.done_count_with_errors.label", {
                  completed: completedCount,
                  total: totalCount,
                  errors: errorCount
                })
              : t("bulk_upload.done_count.label", {
                  completed: completedCount,
                  total: totalCount
                })}
          </Text>

          {bulkUploadState.isUploadInProgress && (
            <div>
              <GhostButton onPress={cancelAllUploads}>
                {t("bulk_upload.cancel_all_files.label")}
              </GhostButton>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-custom">
            {bulkUploadState.files.map((file) => (
              <BulkUploadFileRow
                key={file.id}
                file={file}
                onCancel={cancelPendingUpload}
                isActive={bulkUploadState.isUploadInProgress}
              />
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
};
