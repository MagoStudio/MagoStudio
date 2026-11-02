import { OverlayDialog } from "@components/OverlayDialog";
import { Text } from "@components/Text";
import {
  BulkRendersRunViewShot,
  useBulkRendersRunView
} from "@domains/bulkRendersRun/useBulkRendersRunView";
import { useCancelBulkRendersRunWithConfirmation } from "@domains/bulkRendersRun/useCancelBulkRendersRunWithConfirmation";
import { canRenderBulkRendersRunShotVideoSettings } from "@domains/bulkRendersRun/utils/canRenderBulkRendersRunShotVideoSettings";
import { isStoredVideoModelVisibleToViewer } from "@domains/bulkRendersRun/utils/isStoredVideoModelVisibleToViewer";
import { sortShotIdsByShotName } from "@domains/bulkRendersRun/utils/sortShotIdsByShotName";
import { useProjectShotFolders } from "@domains/project/shotFolders/useProjectShotFolders";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useTimelineList } from "@domains/project/useTimelineList";
import { BulkRenderingStepModalHeader } from "@home/components/SettingsEditor/BulkRenderingStepModalHeader/BulkRenderingStepModalHeader";
import { useIsTeamMember } from "@hooks/userLocalStorage/useIsTeamMember";
import { RENDER_MODELS } from "@models/video/constants";
import {
  VideoEngine,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import { bulkRenderingFlowAtom } from "@store/atoms";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { TabPanel, Tabs } from "react-aria-components/Tabs";
import { useTranslation } from "react-i18next";

import { BulkRenderingShotSettingsPanel } from "../BulkRenderingDraftModal/BulkRenderingShotSettingsPanel";

import { BulkRenderingRunFooter } from "./BulkRenderingRunFooter";
import { BulkRenderingRunImageShotCard } from "./BulkRenderingRunImageShotCard";
import { BulkRenderingRunVideoShotCardContainer } from "./BulkRenderingRunVideoShotCardContainer";

type BulkRenderingRunStepTabId = "image" | "video";

const NOOP_SAVE = () => {};

export function BulkRenderingRunModal({ bulkRunId }: { bulkRunId: string }) {
  const { t } = useTranslation();
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);
  const selectedProjectId = useSelectedProjectId();
  const isTeamMember = useIsTeamMember();
  const { requestCancel, isCancelling } =
    useCancelBulkRendersRunWithConfirmation({
      bulkRunId,
      projectId: selectedProjectId
    });

  const { name, status, aggregatePhase, shots, isError } =
    useBulkRendersRunView(bulkRunId);
  const {
    data: { shotFoldersAndShots }
  } = useProjectShotFolders(selectedProjectId);
  const { thumbnailUrlById: shotPreviewUrlById } =
    useTimelineList(selectedProjectId);

  const shotNameById = new Map(
    shotFoldersAndShots
      .filter((item) => item.type === "shot")
      .map((shot) => [shot.id, shot.name])
  );
  const shotById = new Map(shots.map((shot) => [shot.shotId, shot]));
  const sortedShotIds = sortShotIdsByShotName(
    shots.map((shot) => shot.shotId),
    shotNameById
  );
  const sortedShots = sortedShotIds
    .map((shotId) => shotById.get(shotId))
    .filter((shot): shot is BulkRendersRunViewShot => shot !== undefined);

  const [manuallySelectedStepTab, setManuallySelectedStepTab] =
    useState<BulkRenderingRunStepTabId | null>(null);
  const derivedStepTab: BulkRenderingRunStepTabId =
    aggregatePhase === "video" ? "video" : "image";
  const selectedStepTab = manuallySelectedStepTab ?? derivedStepTab;

  const [openSettingsPanelShotId, setOpenSettingsPanelShotId] = useState<
    string | null
  >(null);

  const closeModal = () => setBulkRenderingFlow(null);

  const resolveShotVideoModelIfVisibleAndSettingsParse = (
    shotVideoEngine: VideoEngine | undefined,
    shotVideoSettingsValues: VideoSettings
  ): VideoModelDefinition | undefined => {
    const shotVideoModelDefinition = RENDER_MODELS.find(
      (model) => model.name === shotVideoEngine
    );
    if (!shotVideoModelDefinition) return undefined;

    const isModelVisibleToThisViewer = isStoredVideoModelVisibleToViewer(
      shotVideoModelDefinition,
      { isTeamMember }
    );
    if (!isModelVisibleToThisViewer) return undefined;

    const doShotSettingsParseAgainstThisModel =
      canRenderBulkRendersRunShotVideoSettings(
        shotVideoModelDefinition,
        shotVideoSettingsValues
      );
    if (!doShotSettingsParseAgainstThisModel) return undefined;

    return shotVideoModelDefinition;
  };

  const openShot = sortedShots.find(
    (shot) => shot.shotId === openSettingsPanelShotId
  );
  const openShotVideoModelDefinition = openShot
    ? resolveShotVideoModelIfVisibleAndSettingsParse(
        openShot.videoSettings.engine,
        openShot.videoSettings.values
      )
    : undefined;

  const imageChainShotCards = sortedShots.map((shot) => (
    <BulkRenderingRunImageShotCard
      key={shot.shotId}
      shotId={shot.shotId}
      shotName={shotNameById.get(shot.shotId) ?? shot.shotId}
      cardState={shot.imageCardState}
      completedStepCount={shot.imageChainProgress.completedStepCount}
      totalStepCount={shot.imageChainProgress.totalStepCount}
      tilePresentation={shot.imageTilePresentation}
      resultImageUrl={shot.imageResultUrl}
      prompt={shot.imageSettings.prompt}
      model={shot.imageSettings.model}
      referenceAssetIds={shot.imageSettings.referenceAssetIds}
    />
  ));
  const videoChainShotCards = sortedShots.map((shot) => (
    <BulkRenderingRunVideoShotCardContainer
      key={shot.shotId}
      shotId={shot.shotId}
      shotName={shotNameById.get(shot.shotId) ?? shot.shotId}
      cardState={shot.videoCardState}
      completedStepCount={shot.videoChainProgress.completedStepCount}
      totalStepCount={shot.videoChainProgress.totalStepCount}
      videoResultRender={shot.videoResultRender}
      shotPreviewUrl={shotPreviewUrlById[shot.shotId]}
      referenceFrameUrl={shot.videoReferenceFrameUrl}
      referenceFrameTilePresentation={shot.videoReferenceFrameTilePresentation}
      prompt={shot.videoSettings.prompt}
      isSettingsOverridden={shot.videoSettings.isOverridden}
      isSettingsRowDisabled={
        resolveShotVideoModelIfVisibleAndSettingsParse(
          shot.videoSettings.engine,
          shot.videoSettings.values
        ) === undefined
      }
      isSettingsPanelOpen={openSettingsPanelShotId === shot.shotId}
      onOpenSettingsPanel={() => setOpenSettingsPanelShotId(shot.shotId)}
    />
  ));

  return (
    <OverlayDialog
      isDismissableByOutsideClick={false}
      isOpen
      onOpenChange={closeModal}
      size={{ mode: "inset", insetXPx: 32, insetYPx: 56 }}
      className="overflow-hidden"
    >
      <Tabs
        selectedKey={selectedStepTab}
        onSelectionChange={(key) =>
          setManuallySelectedStepTab(key as BulkRenderingRunStepTabId)
        }
        className="relative flex h-full w-full flex-col"
      >
        <BulkRenderingStepModalHeader
          runName={name || t("bulk_rendering.run_view_untitled_run.label")}
          tabs={[
            {
              id: "image",
              name: t("bulk_rendering.run_view_image_step_tab.label")
            },
            {
              id: "video",
              name: t("bulk_rendering.run_view_video_step_tab.label")
            }
          ]}
          closeButtonAriaLabel={t(
            "bulk_rendering.run_view_close_button.ariaLabel"
          )}
          onClose={closeModal}
        />

        {isError ? (
          <div className="flex flex-1 items-center justify-center px-4">
            <Text component="span" variant="sm" color="glyph-secondary">
              {t("bulk_rendering.run_view_error.description")}
            </Text>
          </div>
        ) : (
          <>
            <TabPanel
              id="image"
              className="scrollbar-custom min-h-0 flex-1 overflow-y-auto p-4 pb-20"
            >
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(435px,100%),1fr))] gap-x-4 gap-y-6">
                {imageChainShotCards}
              </div>
            </TabPanel>
            <TabPanel id="video" className="relative min-h-0 flex-1">
              <div className="scrollbar-custom h-full overflow-y-auto p-4 pb-20">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(435px,100%),1fr))] gap-x-4 gap-y-6">
                  {videoChainShotCards}
                </div>
              </div>
              {openShot && openShotVideoModelDefinition && (
                <BulkRenderingShotSettingsPanel
                  shotId={openShot.shotId}
                  shotName={
                    shotNameById.get(openShot.shotId) ?? openShot.shotId
                  }
                  videoModel={openShotVideoModelDefinition}
                  values={openShot.videoSettings.values}
                  isReadOnly
                  onSave={NOOP_SAVE}
                  onCancel={() => setOpenSettingsPanelShotId(null)}
                />
              )}
            </TabPanel>
          </>
        )}

        <BulkRenderingRunFooter
          status={status}
          isCancelling={isCancelling}
          onClose={closeModal}
          onCancel={requestCancel}
        />
      </Tabs>
    </OverlayDialog>
  );
}
