import { BulkRenderingShotSettingsRow } from "@components/BulkRenderingShotSettingsRow";
import { FileDropZone } from "@components/FileDropZone";
import { GhostButton } from "@components/GhostButton";
import { Icon } from "@components/Icon";
import { MediaTile } from "@components/MediaTile";
import { Text } from "@components/Text";
import { useFetchBulkRenderingDraftAutoPromptText } from "@domains/bulkRendersRun/useFetchBulkRenderingDraftAutoPromptText";
import { useIsImagePortrait } from "@hooks/useIsImagePortrait";
import { useToast } from "@store/useToast";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { BulkRenderingDraftPromptField } from "./BulkRenderingDraftPromptField";
import { BulkRenderingDraftShotCardChip } from "./BulkRenderingDraftShotCardChip";

export function BulkRenderingDraftVideoShotCard({
  shotId,
  shotName,
  thumbnailUrl,
  isThumbnailLoading,
  videoAssetId,
  isAutoPromptAvailableForSelectedVideoModel,
  videoPrompt,
  onVideoPromptChange,
  isSettingsOverridden,
  hasSettingsError,
  isSettingsPanelOpen,
  onOpenSettingsPanel,
  isFirstFrameSupplied,
  uploadedFirstFrameAssetId,
  onUploadedFirstFrameAssetIdChange,
  hasCompletedAnyFirstFrameUploadBatch
}: {
  shotId: string;
  shotName: string;
  thumbnailUrl: string | undefined;
  isThumbnailLoading: boolean;
  videoAssetId: string | undefined;
  isAutoPromptAvailableForSelectedVideoModel: boolean;
  videoPrompt: string;
  onVideoPromptChange: (value: string) => void;
  isSettingsOverridden: boolean;
  hasSettingsError: boolean;
  isSettingsPanelOpen: boolean;
  onOpenSettingsPanel: () => void;
  isFirstFrameSupplied: boolean;
  uploadedFirstFrameAssetId: string | undefined;
  onUploadedFirstFrameAssetIdChange: (assetId: string) => void;
  hasCompletedAnyFirstFrameUploadBatch: boolean;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { fetchAutoPromptText } = useFetchBulkRenderingDraftAutoPromptText();
  const [isFetchingAutoPrompt, setIsFetchingAutoPrompt] = useState(false);
  const isThumbnailPortrait = useIsImagePortrait(thumbnailUrl);
  const isMissingSuppliedFirstFrame =
    isFirstFrameSupplied && !uploadedFirstFrameAssetId;
  const hasAutoLinkingFailed =
    isMissingSuppliedFirstFrame && hasCompletedAnyFirstFrameUploadBatch;

  const handleRegenerate = async () => {
    if (!videoAssetId) return;
    setIsFetchingAutoPrompt(true);
    try {
      const autoPromptText = await fetchAutoPromptText(videoAssetId);
      if (autoPromptText) {
        onVideoPromptChange(autoPromptText);
      } else {
        showToast({
          message: t(
            "notifications.bulk_renders_run_auto_prompt_unavailable.description"
          )
        });
      }
    } catch {
      showToast({
        message: t(
          "notifications.bulk_renders_run_auto_prompt_unavailable.description"
        )
      });
    } finally {
      setIsFetchingAutoPrompt(false);
    }
  };

  return (
    <div
      data-testid={`bulk-rendering-draft-video-shot-card-${shotId}`}
      className="flex w-full flex-col gap-2"
    >
      <div className="flex h-6 w-full items-center justify-between">
        <Text component="span" variant="sm" color="glyph-secondary">
          {shotName}
        </Text>
        {hasAutoLinkingFailed && (
          <div
            data-testid={`bulk-rendering-draft-video-shot-card-auto-linking-failed-badge-${shotId}`}
            className="flex h-6 shrink-0 items-center justify-center gap-1 rounded pl-0.5 pr-1 py-0.5 backdrop-blur-[10px]"
          >
            <Text component="span" variant="2xs" color="glyph-error">
              {t(
                "bulk_rendering.draft_shot_card_auto_linking_failed_badge.label"
              )}
            </Text>
            <Icon
              iconSet="16-filled"
              iconName="info"
              className="text-glyph-error"
            />
          </div>
        )}
      </div>
      <div className="flex h-[377px] w-full gap-1">
        <MediaTile
          className="h-full w-1/2"
          thumbnailUrl={thumbnailUrl}
          thumbnailScaleMode={isThumbnailPortrait ? "fill" : "fit"}
          isLoading={isThumbnailLoading}
          tilePresentation="asset"
          footer={
            <div className="flex justify-end px-2 pb-2">
              <BulkRenderingDraftShotCardChip
                label={t("bulk_rendering.draft_shot_card_original_chip.label")}
              />
            </div>
          }
        />
        <MediaTile
          testId="bulk-rendering-draft-video-shot-card-frame-tile"
          className="h-full w-1/2"
          tilePresentation={isFirstFrameSupplied ? "asset" : "shimmer"}
          media={
            isFirstFrameSupplied ? (
              <FileDropZone
                size="small"
                maxFileUpload={1}
                value={
                  uploadedFirstFrameAssetId ? [uploadedFirstFrameAssetId] : []
                }
                onChange={(assetIds) => {
                  const latestAssetId = assetIds[assetIds.length - 1];
                  if (latestAssetId) {
                    onUploadedFirstFrameAssetIdChange(latestAssetId);
                  }
                }}
                className="h-full w-full grid-cols-1 auto-rows-[1fr]"
              />
            ) : undefined
          }
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
        value={videoPrompt}
        onChange={onVideoPromptChange}
        minHeightClassName="min-h-[154px]"
        disabled={isMissingSuppliedFirstFrame}
        actions={
          isAutoPromptAvailableForSelectedVideoModel &&
          videoAssetId && (
            <GhostButton
              onPress={handleRegenerate}
              loading={isFetchingAutoPrompt}
              isDisabled={isFetchingAutoPrompt}
            >
              {t("bulk_rendering.draft_shot_card_regenerate_button.label")}
            </GhostButton>
          )
        }
      />
      <BulkRenderingShotSettingsRow
        data-testid={`bulk-rendering-draft-video-shot-settings-row-${shotId}`}
        label={t("bulk_rendering.draft_shot_card_settings_label.label")}
        value={t(
          isSettingsOverridden
            ? "bulk_rendering.draft_shot_card_settings_value_unique.label"
            : "bulk_rendering.draft_shot_card_settings_value.label"
        )}
        icon="edit"
        isDisabled={isMissingSuppliedFirstFrame}
        isOverridden={isSettingsOverridden}
        hasError={hasSettingsError}
        isPanelOpen={isSettingsPanelOpen}
        onPress={onOpenSettingsPanel}
        ariaLabel={t(
          "bulk_rendering.draft_shot_card_settings_edit_button.ariaLabel"
        )}
      />
    </div>
  );
}
