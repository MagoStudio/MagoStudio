import { MainButton } from "@components/MainButton";
import { OverlayDialog } from "@components/OverlayDialog";
import { useBulkRenderingDraftFirstFrameSource } from "@domains/bulkRendersRun/useBulkRenderingDraftFirstFrameSource";
import { useBulkRenderingDraftShotImageModels } from "@domains/bulkRendersRun/useBulkRenderingDraftShotImageModels";
import { useBulkRenderingDraftShotImageReferences } from "@domains/bulkRendersRun/useBulkRenderingDraftShotImageReferences";
import { useBulkRenderingDraftShotImageSettings } from "@domains/bulkRendersRun/useBulkRenderingDraftShotImageSettings";
import { useBulkRenderingDraftShotImageSourceFrames } from "@domains/bulkRendersRun/useBulkRenderingDraftShotImageSourceFrames";
import { useBulkRenderingDraftShotPrompts } from "@domains/bulkRendersRun/useBulkRenderingDraftShotPrompts";
import { useBulkRenderingDraftShotVideoSettings } from "@domains/bulkRendersRun/useBulkRenderingDraftShotVideoSettings";
import { useBulkRendersRunDraftValidation } from "@domains/bulkRendersRun/useBulkRendersRunDraftValidation";
import { useChooseBulkRenderingFirstFrameSource } from "@domains/bulkRendersRun/useChooseBulkRenderingFirstFrameSource";
import { useDefaultBulkRendersRunName } from "@domains/bulkRendersRun/useDefaultBulkRendersRunName";
import { useEstimatedBulkRendersRunCredits } from "@domains/bulkRendersRun/useEstimatedBulkRendersRunCredits";
import { useLaunchBulkRendersRun } from "@domains/bulkRendersRun/useLaunchBulkRendersRun";
import { evaluateBulkRendersRunSubmission } from "@domains/bulkRendersRun/utils/evaluateBulkRendersRunSubmission";
import { isBulkRenderingAvailableForModel } from "@domains/bulkRendersRun/utils/isBulkRenderingAvailableForModel";
import { mergeBulkRenderingDraftShotOverrides } from "@domains/bulkRendersRun/utils/mergeBulkRenderingDraftShotOverrides";
import { sortShotIdsByShotName } from "@domains/bulkRendersRun/utils/sortShotIdsByShotName";
import { useBalance } from "@domains/payment/useBalance";
import { useCurrentSubscription } from "@domains/payment/useCurrentSubscription";
import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { useOpenNewUsersPaywall } from "@domains/payment/useOpenNewUsersPaywall";
import { isSubscriptionKnownToLackAccess } from "@domains/payment/utils/isSubscriptionKnownToLackAccess";
import { useProjectShotFolders } from "@domains/project/shotFolders/useProjectShotFolders";
import { useProject } from "@domains/project/useProject";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useTimelineList } from "@domains/project/useTimelineList";
import { useRenderSubmissionState } from "@domains/renders/useRenderSubmissionState";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { getTrackDuration } from "@domains/track/utils/getTrackDuration";
import { extractFpsFromShot } from "@domains/videoPlayer/utils/extractFpsFromShot";
import { ModelSchemaMap } from "@home/components/Navbar/Img2ImgModalV2/schemas";
import { BulkRenderingStepModalHeader } from "@home/components/SettingsEditor/BulkRenderingStepModalHeader/BulkRenderingStepModalHeader";
import { useIsTeamMember } from "@hooks/userLocalStorage/useIsTeamMember";
import { RENDER_MODELS } from "@models/video/constants";
import { isAutoPromptAvailableForModel } from "@models/video/utils/isAutoPromptAvailableForModel";
import { BulkRenderingDraftState, bulkRenderingFlowAtom } from "@store/atoms";
import { useToast } from "@store/useToast";
import { getFilteredAndSortedLayers } from "@utils";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { TabPanel, Tabs } from "react-aria-components/Tabs";
import { useTranslation } from "react-i18next";

import { BulkRenderingDraftFirstFrameSourceChoice } from "./BulkRenderingDraftFirstFrameSourceChoice";
import { BulkRenderingDraftImageStep } from "./BulkRenderingDraftImageStep";
import { FOOTER_BUTTON_WIDTH_CLASS } from "./bulkRenderingDraftLayout";
import { BulkRenderingDraftVideoStep } from "./BulkRenderingDraftVideoStep";

type BulkRenderingDraftStepTabId = "image" | "video";

const DEFAULT_FPS = 24;

export function BulkRenderingDraftModal({
  draft
}: {
  draft: BulkRenderingDraftState;
}) {
  const { t } = useTranslation();
  const setBulkRenderingFlow = useSetAtom(bulkRenderingFlowAtom);
  const selectedProjectId = useSelectedProjectId();
  const {
    selectedShotIds,
    firstFrameSource,
    uploadedFirstFrameAssetIdByShotId,
    masterSettings,
    imagePromptByShotId,
    videoPromptByShotId,
    imageReferenceAssetIdsByShotId,
    imageModelByShotId,
    imageSourceFrameByShotId,
    videoSettingsByShotId,
    imageSettingByShotId
  } = draft;
  const draftShotFirstFrameSource = useBulkRenderingDraftFirstFrameSource({
    firstFrameSource,
    uploadedFirstFrameAssetIdByShotId
  });
  const isFirstFrameSupplied = draftShotFirstFrameSource.isFirstFrameSupplied;
  const isFirstFrameSourceUndecided = firstFrameSource === undefined;

  const {
    data: { shotFoldersAndShots }
  } = useProjectShotFolders(selectedProjectId);
  const shotNameById = new Map(
    shotFoldersAndShots
      .filter((item) => item.type === "shot")
      .map((shot) => [shot.id, shot.name])
  );
  const sortedShotIds = sortShotIdsByShotName(
    Array.from(selectedShotIds),
    shotNameById
  );
  const shotIdsWithUploadedFirstFrame = new Set(
    Object.keys(uploadedFirstFrameAssetIdByShotId)
  );

  const { data: project } = useProject(selectedProjectId);
  const videoAssetIdByShotId = new Map(
    (project?.timelines ?? []).map((shot) => [
      shot.id,
      getTrackAssetId(getFilteredAndSortedLayers(shot.layers)[0])
    ])
  );
  const videoTrackByShotId = new Map(
    (project?.timelines ?? []).map((shot) => [
      shot.id,
      getFilteredAndSortedLayers(shot.layers)[0]
    ])
  );
  const shotMaxFramesById = new Map(
    (project?.timelines ?? []).map((shot) => [
      shot.id,
      getTrackDuration(getFilteredAndSortedLayers(shot.layers)[0]) ?? 0
    ])
  );
  const shotFpsById = new Map(
    (project?.timelines ?? []).map((shot) => [
      shot.id,
      extractFpsFromShot(shot) ?? DEFAULT_FPS
    ])
  );

  const { thumbnailUrlById, isLoading: isThumbnailListLoading } =
    useTimelineList(selectedProjectId);

  const defaultRunName = useDefaultBulkRendersRunName();
  const runName =
    defaultRunName || t("bulk_rendering.draft_untitled_run.label");

  const isTeamMember = useIsTeamMember();
  const imageModelItems = Object.values(ModelSchemaMap).map((model) => ({
    key: model.value,
    label: model.label
  }));
  const videoModelItems = RENDER_MODELS.filter((model) =>
    isBulkRenderingAvailableForModel(model, { isTeamMember })
  ).map((model) => ({ key: model.name, label: model.displayName }));

  const isAutoPromptAvailableForSelectedVideoModel =
    isAutoPromptAvailableForModel(masterSettings.videoModel);

  const [selectedStepTab, setSelectedStepTab] =
    useState<BulkRenderingDraftStepTabId>("image");
  const stepTabToRender = isFirstFrameSupplied ? "video" : selectedStepTab;
  const { showToast } = useToast();

  const draftShotPrompts = useBulkRenderingDraftShotPrompts({
    masterSettings,
    imagePromptByShotId,
    videoPromptByShotId
  });
  const draftShotImageReferences = useBulkRenderingDraftShotImageReferences({
    masterSettings,
    imageReferenceAssetIdsByShotId
  });
  const draftShotImageSettings = useBulkRenderingDraftShotImageSettings({
    masterSettings,
    imageSettingByShotId
  });
  const draftShotImageModels = useBulkRenderingDraftShotImageModels({
    masterSettings,
    imageModelByShotId,
    shotIds: sortedShotIds,
    getShotPrompt: draftShotPrompts.getImagePrompt,
    getShotReferenceAssetIds:
      draftShotImageReferences.getImageReferenceAssetIds,
    getShotOwnImageSettingWithoutMasterFallback:
      draftShotImageSettings.getShotOwnImageSettingWithoutMasterFallback
  });
  const draftShotImageSourceFrames = useBulkRenderingDraftShotImageSourceFrames(
    { imageSourceFrameByShotId }
  );
  const draftShotVideoSettings = useBulkRenderingDraftShotVideoSettings({
    masterSettings,
    videoSettingsByShotId
  });
  const draftValidationErrorsByShotId = useBulkRendersRunDraftValidation({
    shotIds: sortedShotIds,
    masterSettings,
    draftShotVideoSettings,
    firstFrameSource,
    uploadedFirstFrameAssetIdByShotId
  });
  const hasAnyShotSettingsError = Object.values(
    draftValidationErrorsByShotId
  ).some((errors) => errors.length > 0);
  const { estimatedRunCredits, isVideoCostPerShotResolved } =
    useEstimatedBulkRendersRunCredits({
      selectedShotIds: sortedShotIds,
      imageSettingsByShotId: draftShotImageModels.imageSettingsByShotId,
      masterSettings,
      draftShotVideoSettings,
      shotMaxFramesById,
      shotFpsById,
      isTeamMember,
      shotIdsWithUploadedFirstFrame
    });

  const { range: rangeSubmission } = useRenderSubmissionState();
  const { isUnlimitedModeActive } = useIsUnlimitedModeActive();
  const { data: balanceData } = useBalance();
  const { doesSubscriptionGrantAccess, isLoading: isSubscriptionLoading } =
    useCurrentSubscription();
  const isPaywallEligible = isSubscriptionKnownToLackAccess({
    isSubscriptionLoading,
    doesSubscriptionGrantAccess
  });
  const openNewUsersPaywall = useOpenNewUsersPaywall();

  const { isSubmissionBlocked, shouldOpenPaywallOnPress } =
    evaluateBulkRendersRunSubmission({
      openShotCanSubmit: rangeSubmission.canSubmit,
      openShotIsBlockedByCreditPaywall:
        rangeSubmission.isBlockedByCreditPaywall,
      isPaywallEligible,
      isUnlimitedModeActive,
      userCredits: balanceData?.amount ?? 0,
      isRequiredCreditsForRunResolved: isVideoCostPerShotResolved,
      requiredCreditsForRun: estimatedRunCredits
    });

  const { launchBulkRendersRun, isLaunching } = useLaunchBulkRendersRun({
    selectedShotIds: sortedShotIds,
    masterSettings,
    isTeamMember,
    firstFrameSource: isFirstFrameSupplied ? "uploaded" : "generated",
    shotMaxFramesById
  });

  const closeDraft = () => setBulkRenderingFlow(null);
  const backToShotSelection = () =>
    setBulkRenderingFlow({ view: "shotSelection", selectedShotIds });
  const chooseFirstFrameSource = useChooseBulkRenderingFirstFrameSource();

  const requestLeave = (leaveDraft: () => void) => {
    const hasUnsavedShotSettings =
      draftShotPrompts.hasAnyShotPromptOverride ||
      draftShotImageReferences.hasAnyShotImageReferenceOverride ||
      draftShotImageModels.hasAnyShotImageModelOverride ||
      draftShotImageSettings.hasAnyShotImageSettingOverride ||
      draftShotImageSourceFrames.hasAnyShotImageSourceFrameOverride ||
      draftShotVideoSettings.hasAnyShotVideoSettingsOverride;

    if (!hasUnsavedShotSettings) {
      leaveDraft();
      return;
    }

    showToast({
      message: t("bulk_rendering.draft_discard_warning_description.label"),
      onSubmit: leaveDraft,
      onSubmitText: t(
        "bulk_rendering.draft_discard_warning_confirm_button.label"
      ),
      onCancelText: t(
        "bulk_rendering.draft_discard_warning_cancel_button.label"
      )
    });
  };

  const isGenerateDisabled =
    isFirstFrameSourceUndecided ||
    sortedShotIds.length === 0 ||
    isLaunching ||
    isSubmissionBlocked ||
    hasAnyShotSettingsError;

  const pressGenerate = () => {
    if (shouldOpenPaywallOnPress) {
      openNewUsersPaywall();
      return;
    }
    void launchBulkRendersRun(
      runName,
      mergeBulkRenderingDraftShotOverrides({
        shotPromptOverrideById: draftShotPrompts.shotPromptOverrideById,
        imageReferenceAssetIdsOverrideByShotId:
          draftShotImageReferences.imageReferenceAssetIdsOverrideByShotId,
        imageSettingsOverrideByShotId:
          draftShotImageModels.imageSettingsOverrideByShotId,
        imageSourceFrameOverrideByShotId:
          draftShotImageSourceFrames.imageSourceFrameOverrideByShotId,
        shotVideoSettingsOverrideById:
          draftShotVideoSettings.shotVideoSettingsOverrideById,
        uploadedFirstFrameAssetIdByShotId
      })
    );
  };

  if (isFirstFrameSourceUndecided) {
    return (
      <OverlayDialog
        isDismissableByOutsideClick={false}
        isOpen
        onOpenChange={() => requestLeave(closeDraft)}
        size={{ mode: "inset", insetXPx: 32, insetYPx: 56 }}
        className="overflow-hidden"
      >
        <div className="relative flex h-full w-full flex-col">
          <BulkRenderingStepModalHeader
            runName={runName}
            tabs={[]}
            closeButtonAriaLabel={t(
              "bulk_rendering.draft_close_button.ariaLabel"
            )}
            onClose={() => requestLeave(closeDraft)}
          />
          <div className="min-h-0 flex-1">
            <BulkRenderingDraftFirstFrameSourceChoice
              onChoose={chooseFirstFrameSource}
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex h-12 items-center justify-end gap-2 bg-surface-secondary px-5 py-2 shadow-[0px_0px_16px_0px_rgba(0,0,0,0.6)]">
            <MainButton
              colorScheme="secondary"
              className={FOOTER_BUTTON_WIDTH_CLASS}
              onPress={() => requestLeave(backToShotSelection)}
            >
              {t(
                "bulk_rendering.draft_first_frame_source_choice_back_button.label"
              )}
            </MainButton>
            <MainButton
              colorScheme="primary"
              className={FOOTER_BUTTON_WIDTH_CLASS}
              isDisabled
            >
              {t(
                "bulk_rendering.draft_first_frame_source_choice_generate_button.label"
              )}
            </MainButton>
          </div>
        </div>
      </OverlayDialog>
    );
  }

  return (
    <OverlayDialog
      isDismissableByOutsideClick={false}
      isOpen
      onOpenChange={() => requestLeave(closeDraft)}
      size={{ mode: "inset", insetXPx: 32, insetYPx: 56 }}
      className="overflow-hidden"
    >
      <Tabs
        selectedKey={stepTabToRender}
        onSelectionChange={(key) =>
          setSelectedStepTab(key as BulkRenderingDraftStepTabId)
        }
        className="flex h-full w-full flex-col"
      >
        <BulkRenderingStepModalHeader
          runName={runName}
          tabs={
            isFirstFrameSupplied
              ? [
                  {
                    id: "video",
                    name: t("bulk_rendering.draft_video_step_tab.label")
                  }
                ]
              : [
                  {
                    id: "image",
                    name: t("bulk_rendering.draft_image_step_tab.label")
                  },
                  {
                    id: "video",
                    name: t("bulk_rendering.draft_video_step_tab.label")
                  }
                ]
          }
          closeButtonAriaLabel={t(
            "bulk_rendering.draft_close_button.ariaLabel"
          )}
          onClose={() => requestLeave(closeDraft)}
        />
        {!isFirstFrameSupplied && (
          <TabPanel id="image" className="min-h-0 flex-1">
            <BulkRenderingDraftImageStep
              shotIds={sortedShotIds}
              shotNameById={shotNameById}
              thumbnailUrlById={thumbnailUrlById}
              isThumbnailListLoading={isThumbnailListLoading}
              shotMaxFramesById={shotMaxFramesById}
              videoTrackByShotId={videoTrackByShotId}
              imageModelItems={imageModelItems}
              draftShotPrompts={draftShotPrompts}
              draftShotImageReferences={draftShotImageReferences}
              draftShotImageModels={draftShotImageModels}
              draftShotImageSettings={draftShotImageSettings}
              draftShotImageSourceFrames={draftShotImageSourceFrames}
              onBack={() => requestLeave(backToShotSelection)}
              onCheckVideoSettings={() => setSelectedStepTab("video")}
            />
          </TabPanel>
        )}
        <TabPanel id="video" className="min-h-0 flex-1">
          <BulkRenderingDraftVideoStep
            shotIds={sortedShotIds}
            shotNameById={shotNameById}
            thumbnailUrlById={thumbnailUrlById}
            isThumbnailListLoading={isThumbnailListLoading}
            videoAssetIdByShotId={videoAssetIdByShotId}
            isAutoPromptAvailableForSelectedVideoModel={
              isAutoPromptAvailableForSelectedVideoModel
            }
            draftShotPrompts={draftShotPrompts}
            draftShotFirstFrameSource={draftShotFirstFrameSource}
            masterSettings={masterSettings}
            draftShotVideoSettings={draftShotVideoSettings}
            draftValidationErrorsByShotId={draftValidationErrorsByShotId}
            isTeamMember={isTeamMember}
            estimatedCredits={estimatedRunCredits}
            isGenerateDisabled={isGenerateDisabled}
            isGenerating={isLaunching}
            isUnlimitedModeActive={isUnlimitedModeActive}
            onBack={
              isFirstFrameSupplied
                ? undefined
                : () => setSelectedStepTab("image")
            }
            onGenerate={pressGenerate}
          />
        </TabPanel>
      </Tabs>
    </OverlayDialog>
  );
}
