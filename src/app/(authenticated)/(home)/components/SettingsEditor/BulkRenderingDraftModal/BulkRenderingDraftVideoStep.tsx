import { toFixed } from "@app/utils/priceHelper";
import { CreditCoin } from "@components/CreditCoin";
import { FileDropZone } from "@components/FileDropZone";
import { GhostButton } from "@components/GhostButton";
import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { BulkRenderingDraftFirstFrameSourceState } from "@domains/bulkRendersRun/useBulkRenderingDraftFirstFrameSource";
import { BulkRenderingDraftShotPromptsState } from "@domains/bulkRendersRun/useBulkRenderingDraftShotPrompts";
import { BulkRenderingDraftShotVideoSettingsState } from "@domains/bulkRendersRun/useBulkRenderingDraftShotVideoSettings";
import { useBulkRenderingFirstFrameUpload } from "@domains/bulkRendersRun/useBulkRenderingFirstFrameUpload";
import { buildBulkRenderingDraftShotVideoSettings } from "@domains/bulkRendersRun/utils/buildBulkRenderingDraftShotVideoSettings";
import { buildBulkRenderingMasterVideoSettingsSummary } from "@domains/bulkRendersRun/utils/buildBulkRenderingMasterVideoSettingsSummary";
import { SettingValidationError } from "@domains/bulkRendersRun/utils/validateBulkRenderingShotVideoSettings";
import { VideoSettings } from "@models/video/types";
import { BulkRendersRunDraftMasterSettings } from "@store/atoms";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { BulkRenderingFirstFrameUploadModal } from "../BulkRenderingFirstFrameUploadModal/BulkRenderingFirstFrameUploadModal";

import {
  FOOTER_BUTTON_WIDTH_CLASS,
  SCROLLBAR_COMPENSATED_RIGHT_PADDING_CLASS,
  SHOT_CARD_GRID_COLUMNS_CLASS
} from "./bulkRenderingDraftLayout";
import { BulkRenderingDraftVideoShotCard } from "./BulkRenderingDraftVideoShotCard";
import { BulkRenderingShotSettingsPanel } from "./BulkRenderingShotSettingsPanel";

const FIRST_FRAME_BULK_DROP_ZONE_MAX_FILES = 999;

export function BulkRenderingDraftVideoStep({
  shotIds,
  shotNameById,
  thumbnailUrlById,
  isThumbnailListLoading,
  videoAssetIdByShotId,
  isAutoPromptAvailableForSelectedVideoModel,
  draftShotPrompts,
  draftShotFirstFrameSource,
  masterSettings,
  draftShotVideoSettings,
  draftValidationErrorsByShotId,
  isTeamMember,
  estimatedCredits,
  isGenerateDisabled,
  isGenerating,
  isUnlimitedModeActive,
  onBack,
  onGenerate
}: {
  shotIds: string[];
  shotNameById: Map<string, string>;
  thumbnailUrlById: Record<string, string | undefined>;
  isThumbnailListLoading: boolean;
  videoAssetIdByShotId: Map<string, string | undefined>;
  isAutoPromptAvailableForSelectedVideoModel: boolean;
  draftShotPrompts: BulkRenderingDraftShotPromptsState;
  draftShotFirstFrameSource: BulkRenderingDraftFirstFrameSourceState;
  masterSettings: BulkRendersRunDraftMasterSettings;
  draftShotVideoSettings: BulkRenderingDraftShotVideoSettingsState;
  draftValidationErrorsByShotId: Record<string, SettingValidationError[]>;
  isTeamMember: boolean;
  estimatedCredits: number;
  isGenerateDisabled: boolean;
  isGenerating: boolean;
  isUnlimitedModeActive: boolean;
  onBack?: () => void;
  onGenerate: () => void;
}) {
  const { t } = useTranslation();
  const formattedEstimatedCredits = toFixed(estimatedCredits);
  const isFirstFrameSupplied = draftShotFirstFrameSource.isFirstFrameSupplied;
  const shots = shotIds.map((shotId) => ({
    id: shotId,
    name: shotNameById.get(shotId) ?? shotId
  }));
  const {
    items: firstFrameUploadItems,
    hasCompletedAnyUploadBatch: hasCompletedAnyFirstFrameUploadBatch,
    startUpload: startFirstFrameUpload,
    dismissItem: dismissFirstFrameUploadItem,
    cancelAll: cancelAllFirstFrameUploads,
    closeAll: closeFirstFrameUploadModal
  } = useBulkRenderingFirstFrameUpload({ shots });

  const [openSettingsPanelShotId, setOpenSettingsPanelShotId] = useState<
    string | null
  >(null);
  const [isMasterSettingsSummaryVisible, setIsMasterSettingsSummaryVisible] =
    useState(false);

  const masterSettingsSummary = buildBulkRenderingMasterVideoSettingsSummary({
    videoModel: masterSettings.videoModel,
    videoSettings: masterSettings.videoSettings,
    isTeamMember
  });

  const openShotId = openSettingsPanelShotId;
  const openShotVideoModelDefinition = openShotId
    ? masterSettings.videoModel
    : undefined;
  const openShotValues = openShotId
    ? buildBulkRenderingDraftShotVideoSettings({
        masterSettings,
        shotVideoSettingsPatch:
          draftShotVideoSettings.shotVideoSettingsOverrideById[openShotId] ?? {}
      })
    : undefined;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div
        className={`scrollbar-custom flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pt-2 pb-14 pl-4 ${SCROLLBAR_COMPENSATED_RIGHT_PADDING_CLASS}`}
      >
        <div className="flex flex-col gap-1 rounded-lg border border-glyph-stroke bg-surface-primary p-3">
          <div className="flex h-6 shrink-0 items-center justify-between">
            <Text
              component="span"
              variant="sm"
              weight="bold"
              color="glyph-primary"
            >
              {t("bulk_rendering.draft_video_step_master_settings_label.label")}
            </Text>
            <GhostButton
              onPress={() =>
                setIsMasterSettingsSummaryVisible((isVisible) => !isVisible)
              }
            >
              {isMasterSettingsSummaryVisible
                ? t(
                    "bulk_rendering.draft_video_step_master_settings_hide_button.label"
                  )
                : t(
                    "bulk_rendering.draft_video_step_master_settings_show_button.label"
                  )}
            </GhostButton>
          </div>
          {isMasterSettingsSummaryVisible && (
            <div className="columns-1 gap-x-6 py-2 sm:columns-2 lg:columns-3">
              <div className="mb-1 flex break-inside-avoid items-center justify-between gap-2">
                <Text
                  component="span"
                  variant="2xs"
                  color="glyph-secondary"
                  className="leading-4"
                >
                  {t("bulk_rendering.draft_shot_card_model_label.label")}
                </Text>
                <Text
                  component="span"
                  variant="2xs"
                  color="glyph-primary"
                  className="leading-4"
                >
                  {masterSettings.videoModel.displayName}
                </Text>
              </div>
              {masterSettingsSummary.map((entry) => (
                <div
                  key={entry.key}
                  className="mb-1 flex break-inside-avoid items-center justify-between gap-2"
                >
                  <Text
                    component="span"
                    variant="2xs"
                    color="glyph-secondary"
                    className="leading-4"
                  >
                    {entry.label}
                  </Text>
                  <Text
                    component="span"
                    variant="2xs"
                    color="glyph-primary"
                    className="leading-4"
                  >
                    {entry.value}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </div>
        {isFirstFrameSupplied && (
          <div data-testid="bulk-rendering-draft-first-frame-bulk-drop-zone">
            <FileDropZone
              maxFileUpload={FIRST_FRAME_BULK_DROP_ZONE_MAX_FILES}
              text={t("bulk_rendering.first_frame_bulk_drop_zone_title.label")}
              hintText={t(
                "bulk_rendering.first_frame_bulk_drop_zone_hint.label"
              )}
              onFilesSelected={startFirstFrameUpload}
              className="w-full"
            />
          </div>
        )}
        <div className={`grid gap-x-4 gap-y-6 ${SHOT_CARD_GRID_COLUMNS_CLASS}`}>
          {shotIds.map((shotId) => (
            <BulkRenderingDraftVideoShotCard
              key={shotId}
              shotId={shotId}
              shotName={shotNameById.get(shotId) ?? shotId}
              thumbnailUrl={thumbnailUrlById[shotId]}
              isThumbnailLoading={isThumbnailListLoading}
              videoAssetId={videoAssetIdByShotId.get(shotId)}
              isAutoPromptAvailableForSelectedVideoModel={
                isAutoPromptAvailableForSelectedVideoModel
              }
              videoPrompt={draftShotPrompts.getVideoPrompt(shotId)}
              onVideoPromptChange={(value) =>
                draftShotPrompts.setVideoPrompt(shotId, value)
              }
              isFirstFrameSupplied={isFirstFrameSupplied}
              uploadedFirstFrameAssetId={draftShotFirstFrameSource.getUploadedFirstFrameAssetId(
                shotId
              )}
              onUploadedFirstFrameAssetIdChange={(assetId) =>
                draftShotFirstFrameSource.setUploadedFirstFrameAssetId(
                  shotId,
                  assetId
                )
              }
              hasCompletedAnyFirstFrameUploadBatch={
                hasCompletedAnyFirstFrameUploadBatch
              }
              isSettingsOverridden={
                Object.keys(
                  draftShotVideoSettings.shotVideoSettingsOverrideById[
                    shotId
                  ] ?? {}
                ).length > 0
              }
              hasSettingsError={
                (draftValidationErrorsByShotId[shotId]?.length ?? 0) > 0
              }
              isSettingsPanelOpen={openSettingsPanelShotId === shotId}
              onOpenSettingsPanel={() => setOpenSettingsPanelShotId(shotId)}
            />
          ))}
        </div>
      </div>
      {openShotId && openShotVideoModelDefinition && openShotValues && (
        <BulkRenderingShotSettingsPanel
          shotId={openShotId}
          shotName={shotNameById.get(openShotId) ?? openShotId}
          videoModel={openShotVideoModelDefinition}
          values={openShotValues}
          errors={draftValidationErrorsByShotId[openShotId]}
          onSave={(patch) => {
            for (const key of Object.keys(patch)) {
              draftShotVideoSettings.setVideoSetting(
                openShotId,
                key as keyof VideoSettings,
                patch[key as keyof VideoSettings]
              );
            }
            setOpenSettingsPanelShotId(null);
          }}
          onCancel={() => setOpenSettingsPanelShotId(null)}
        />
      )}
      {firstFrameUploadItems.length > 0 && (
        <BulkRenderingFirstFrameUploadModal
          items={firstFrameUploadItems}
          onDismissItem={dismissFirstFrameUploadItem}
          onCancelAll={cancelAllFirstFrameUploads}
          onClose={closeFirstFrameUploadModal}
        />
      )}
      <div className="absolute inset-x-0 bottom-0 flex h-12 items-center justify-end gap-2 bg-surface-secondary px-5 py-2 shadow-[0px_0px_16px_0px_rgba(0,0,0,0.6)]">
        {isUnlimitedModeActive && (
          <Text
            component="span"
            variant="xs"
            color="glyph-warning"
            className="mr-auto"
            data-testid="bulk-rendering-draft-credits-mode-only-notice"
          >
            {t("bulk_rendering.draft_credits_mode_only_notice.label")}
          </Text>
        )}
        {onBack && (
          <MainButton
            colorScheme="secondary"
            className={FOOTER_BUTTON_WIDTH_CLASS}
            onPress={onBack}
          >
            {t("bulk_rendering.draft_video_step_back_button.label")}
          </MainButton>
        )}
        <MainButton
          data-testid="bulk-rendering-draft-generate-button"
          colorScheme="primary"
          className={FOOTER_BUTTON_WIDTH_CLASS}
          isDisabled={isGenerateDisabled}
          loading={isGenerating}
          onPress={onGenerate}
        >
          {t("bulk_rendering.draft_video_step_generate_button.label")}
          {!isUnlimitedModeActive && (
            <CreditCoin
              count={formattedEstimatedCredits}
              disabled={isGenerateDisabled}
              marginLeft
              monochrome
            />
          )}
        </MainButton>
      </div>
    </div>
  );
}
