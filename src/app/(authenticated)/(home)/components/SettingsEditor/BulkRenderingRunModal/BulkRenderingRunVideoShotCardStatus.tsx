import { InfoTooltipIcon } from "@components/InfoTooltipIcon";
import { ProgressBar } from "@components/ProgressBar";
import { Text } from "@components/Text";
import { BulkRendersRunShotVideoCardState } from "@domains/bulkRendersRun/utils/deriveBulkRendersRunShotVideoCardState";
import { GlyphPalette } from "@styles/types";
import { useTranslation } from "react-i18next";

const PERCENTAGE_MULTIPLIER = 100;

const STATUS_LABEL_KEY_BY_STATE: Partial<
  Record<BulkRendersRunShotVideoCardState, string>
> = {
  rendering: "bulk_rendering.shot_phase_in_progress.label",
  ready: "bulk_rendering.shot_phase_completed.label",
  qualityFailure:
    "bulk_rendering.run_view_video_card_quality_failure_status.label",
  infrastructureFailure:
    "bulk_rendering.run_view_video_card_infrastructure_failure_status.label"
};

const STATUS_COLOR_BY_STATE: Partial<
  Record<BulkRendersRunShotVideoCardState, GlyphPalette>
> = {
  rendering: "glyph-warning",
  ready: "glyph-success",
  qualityFailure: "glyph-error",
  infrastructureFailure: "glyph-error"
};

export function BulkRenderingRunVideoShotCardStatus({
  cardState,
  completedStepCount,
  totalStepCount
}: {
  cardState: BulkRendersRunShotVideoCardState;
  completedStepCount: number;
  totalStepCount: number;
}) {
  const { t } = useTranslation();

  if (cardState === "pending") return null;

  const statusColor = STATUS_COLOR_BY_STATE[cardState] ?? "glyph-warning";
  const statusLabelKey = STATUS_LABEL_KEY_BY_STATE[cardState];
  const isQualityFailure = cardState === "qualityFailure";
  const isRendering = cardState === "rendering";
  const isVideoChainFinished = cardState === "ready";
  const completionRatio =
    totalStepCount > 0 ? completedStepCount / totalStepCount : 0;
  const progressPercentage = isVideoChainFinished
    ? PERCENTAGE_MULTIPLIER
    : completionRatio * PERCENTAGE_MULTIPLIER;

  return (
    <div
      data-testid="bulk-rendering-run-video-shot-card-header-status"
      className="flex items-center gap-2"
    >
      <div className="flex h-6 items-center gap-1 rounded px-1.5 py-0.5 backdrop-blur-[10px]">
        <Text component="span" variant="2xs" color={statusColor}>
          {statusLabelKey ? t(statusLabelKey) : null}
        </Text>
        {isQualityFailure && (
          <InfoTooltipIcon
            tooltip={t(
              "bulk_rendering.run_view_video_card_quality_failure_tooltip.description"
            )}
            labelColor="glyph-error"
          />
        )}
      </div>
      {(isRendering || isVideoChainFinished) && (
        <div className="w-20">
          <ProgressBar progress={progressPercentage} color={statusColor} />
        </div>
      )}
    </div>
  );
}
