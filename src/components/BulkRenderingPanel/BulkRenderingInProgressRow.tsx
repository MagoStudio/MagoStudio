import { ProgressBar } from "@components/ProgressBar";
import { Text } from "@components/Text";
import { Button } from "react-aria-components";
import { useTranslation } from "react-i18next";

import { BulkRenderingPausedRowActions } from "./BulkRenderingPausedRowActions";
import { BulkRenderingInProgressRow as BulkRenderingInProgressRowData } from "./types";

interface Props {
  row: BulkRenderingInProgressRowData;
  isQueued: boolean;
  isPaused: boolean;
  isCancelling: boolean;
  isResuming: boolean;
  onActivate: () => void;
  onCancel: () => void;
  onContinue: () => void;
}

export const BulkRenderingInProgressRow: React.FC<Props> = ({
  row,
  isQueued,
  isPaused,
  isCancelling,
  isResuming,
  onActivate,
  onCancel,
  onContinue
}) => {
  const { t } = useTranslation();
  const progressGlyphColor = isQueued ? "glyph-tertiary" : "glyph-warning";

  return (
    <div
      data-testid={`bulk-rendering-in-progress-row-${row.runId}`}
      className="flex w-full items-start gap-4 rounded-lg bg-surface-primary p-4 text-left"
    >
      <Button
        onPress={onActivate}
        aria-label={t(
          "bulk_rendering.panel_row_toggle_in_progress_row.ariaLabel",
          { runName: row.runName }
        )}
        className="flex min-w-0 flex-1 flex-col gap-1 text-left outline-none"
      >
        <Text variant="md" color="glyph-primary" className="leading-5 truncate">
          {row.runName}
        </Text>
        <div className="flex w-fit flex-wrap items-center gap-4">
          {row.currentStepName && row.currentStepNumber && (
            <Text variant="sm" color="glyph-secondary">
              {t("bulk_rendering.panel_row_step.label", {
                stepNumber: row.currentStepNumber,
                stepName: row.currentStepName
              })}
            </Text>
          )}
          <Text variant="sm" color="glyph-secondary">
            {t("bulk_rendering.panel_row_images_stat.label", {
              completed: row.imageChainCompletedCount,
              total: row.imageTotalCount
            })}
          </Text>
          <Text variant="sm" color="glyph-secondary">
            {t("bulk_rendering.panel_row_videos_stat.label", {
              completed: row.videoChainCompletedCount,
              total: row.videoTotalCount
            })}
          </Text>
        </div>
      </Button>
      {isPaused ? (
        <BulkRenderingPausedRowActions
          isCancelling={isCancelling}
          isResuming={isResuming}
          onCancel={onCancel}
          onContinue={onContinue}
        />
      ) : (
        <div className="flex shrink-0 items-center gap-3">
          <Text
            variant="2xs"
            color={progressGlyphColor}
            className="leading-4 whitespace-nowrap"
          >
            {isQueued
              ? t("bulk_rendering.panel_row_queued_status.label")
              : row.elapsedTimeLabel}
          </Text>
          <div className="w-20">
            <ProgressBar
              progress={isQueued ? 0 : row.progressPercent}
              color={progressGlyphColor}
            />
          </div>
        </div>
      )}
    </div>
  );
};
