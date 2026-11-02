import { BulkRenderingShotSettingsRow } from "@components/BulkRenderingShotSettingsRow";
import { Icon } from "@components/Icon";
import { InlineVideoPlayer } from "@components/InlineVideoPlayer";
import { MediaTile } from "@components/MediaTile";
import { Text } from "@components/Text";
import { BulkRendersRunShotVideoCardState } from "@domains/bulkRendersRun/utils/deriveBulkRendersRunShotVideoCardState";
import { BulkRendersRunShotVideoReferenceFrameTilePresentation } from "@domains/bulkRendersRun/utils/deriveBulkRendersRunShotVideoReferenceFrameTilePresentation";
import { BulkRendersRunShotVideoTilePresentation } from "@domains/bulkRendersRun/utils/deriveBulkRendersRunShotVideoTilePresentation";
import { resolveMediaTilePresentationFromBulkRendersRunTileState } from "@domains/bulkRendersRun/utils/resolveMediaTilePresentationFromBulkRendersRunTileState";
import { useIsImagePortrait } from "@hooks/useIsImagePortrait";
import { useTranslation } from "react-i18next";

import { BulkRenderingDraftPromptField } from "../BulkRenderingDraftModal/BulkRenderingDraftPromptField";
import { BulkRenderingDraftShotCardChip } from "../BulkRenderingDraftModal/BulkRenderingDraftShotCardChip";

import { BulkRenderingRunVideoShotCardStatus } from "./BulkRenderingRunVideoShotCardStatus";

const RENDERING_PLACEHOLDER_SIZE_CLASS_NAME = "h-[120px] w-[120px]";

const TILE_STATUS_LABEL_KEY_BY_FAILURE_PRESENTATION: Partial<
  Record<BulkRendersRunShotVideoTilePresentation, string>
> = {
  qualityFailure:
    "bulk_rendering.run_view_video_card_quality_failure_tile.label",
  infrastructureFailure:
    "bulk_rendering.run_view_video_card_infrastructure_failure_tile.label"
};

export function BulkRenderingRunVideoShotCard({
  shotId,
  shotName,
  cardState,
  completedStepCount,
  totalStepCount,
  tilePresentation,
  referenceFrameTilePresentation,
  resultThumbnailUrl,
  resultVideoUrl,
  referenceFrameUrl,
  prompt,
  isSettingsOverridden,
  isSettingsRowDisabled,
  isSettingsPanelOpen,
  onOpenSettingsPanel
}: {
  shotId: string;
  shotName: string;
  cardState: BulkRendersRunShotVideoCardState;
  completedStepCount: number;
  totalStepCount: number;
  tilePresentation: BulkRendersRunShotVideoTilePresentation;
  referenceFrameTilePresentation: BulkRendersRunShotVideoReferenceFrameTilePresentation;
  resultThumbnailUrl: string | undefined;
  resultVideoUrl: string | undefined;
  referenceFrameUrl: string | undefined;
  prompt: string | undefined;
  isSettingsOverridden: boolean;
  isSettingsRowDisabled: boolean;
  isSettingsPanelOpen: boolean;
  onOpenSettingsPanel: () => void;
}) {
  const { t } = useTranslation();

  const isResultPortrait = useIsImagePortrait(resultThumbnailUrl);
  const isReferenceFramePortrait = useIsImagePortrait(referenceFrameUrl);

  const tileFailureStatusLabelKey =
    TILE_STATUS_LABEL_KEY_BY_FAILURE_PRESENTATION[tilePresentation];
  const hasVideoStepStarted = cardState !== "pending";
  const resultChipLabel = hasVideoStepStarted
    ? t("bulk_rendering.draft_shot_card_result_chip.label")
    : t("bulk_rendering.draft_shot_card_original_chip.label");
  const hasPlayableResult =
    tilePresentation === "video" && !!resultThumbnailUrl;
  const canPlayResultInline = hasPlayableResult && !!resultVideoUrl;

  return (
    <div
      data-testid={`bulk-rendering-run-video-shot-card-${shotId}`}
      data-card-state={cardState}
      className="flex w-full flex-col gap-2"
    >
      <div className="flex h-6 items-center justify-between gap-2">
        <Text component="span" variant="sm" color="glyph-secondary">
          {shotName}
        </Text>
        <BulkRenderingRunVideoShotCardStatus
          cardState={cardState}
          completedStepCount={completedStepCount}
          totalStepCount={totalStepCount}
        />
      </div>
      <div className="flex h-[377px] w-full gap-1">
        <MediaTile
          testId="bulk-rendering-run-video-shot-card-result-tile"
          className="h-full w-1/2"
          thumbnailUrl={resultThumbnailUrl}
          thumbnailScaleMode={isResultPortrait ? "fill" : "fit"}
          media={
            canPlayResultInline && resultVideoUrl ? (
              <InlineVideoPlayer
                videoUrl={resultVideoUrl}
                posterUrl={resultThumbnailUrl}
                posterAlt={shotName}
                objectFit={isResultPortrait ? "cover" : "contain"}
                testId="bulk-rendering-run-video-shot-card-player"
                playAriaLabel={t(
                  "bulk_rendering.run_view_video_card_play_video.ariaLabel",
                  { shotName }
                )}
                pauseAriaLabel={t(
                  "bulk_rendering.run_view_video_card_pause_video.ariaLabel",
                  { shotName }
                )}
              />
            ) : undefined
          }
          tilePresentation={resolveMediaTilePresentationFromBulkRendersRunTileState(
            tilePresentation
          )}
          centeredContent={
            tilePresentation === "rendering" ? (
              <img
                src="/flower.gif"
                alt=""
                className={RENDERING_PLACEHOLDER_SIZE_CLASS_NAME}
              />
            ) : tileFailureStatusLabelKey ? (
              <div className="flex flex-col items-center gap-2">
                <Icon
                  iconSet="24"
                  iconName="warning"
                  className="text-glyph-error"
                />
                <Text component="span" variant="2xs" color="glyph-error">
                  {t(tileFailureStatusLabelKey)}
                </Text>
              </div>
            ) : undefined
          }
          centeredOverlay={
            hasPlayableResult && !canPlayResultInline ? (
              <Icon
                iconSet="24-filled"
                iconName="play-forward"
                className="text-glyph-primary-on-pic"
              />
            ) : undefined
          }
          footer={
            <div className="flex justify-end px-2 pb-2">
              <BulkRenderingDraftShotCardChip label={resultChipLabel} />
            </div>
          }
        />
        <MediaTile
          testId="bulk-rendering-run-video-shot-card-reference-frame-tile"
          className="h-full w-1/2"
          thumbnailUrl={referenceFrameUrl}
          thumbnailScaleMode={isReferenceFramePortrait ? "fill" : "fit"}
          tilePresentation={resolveMediaTilePresentationFromBulkRendersRunTileState(
            referenceFrameTilePresentation
          )}
          footer={
            <div className="flex justify-end px-2 pb-2">
              <BulkRenderingDraftShotCardChip
                label={t("bulk_rendering.draft_shot_card_frame_chip.label")}
              />
            </div>
          }
        />
      </div>
      <BulkRenderingDraftPromptField
        shotName={shotName}
        value={prompt ?? ""}
        onChange={() => {}}
        minHeightClassName="min-h-[154px]"
        disabled
      />
      <BulkRenderingShotSettingsRow
        data-testid={`bulk-rendering-run-video-shot-settings-row-${shotId}`}
        value={t("bulk_rendering.run_view_video_card_settings_info.label")}
        icon="visibility"
        isOverridden={isSettingsOverridden}
        isDisabled={isSettingsRowDisabled}
        isPanelOpen={isSettingsPanelOpen}
        onPress={onOpenSettingsPanel}
        ariaLabel={t(
          "bulk_rendering.run_view_video_card_settings_view_button.ariaLabel"
        )}
      />
    </div>
  );
}
