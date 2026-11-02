import { toFixed } from "@app/utils/priceHelper";
import { Alert } from "@components/Alert";
import { CreditCoin } from "@components/CreditCoin";
import { MainButton } from "@components/MainButton";
import { Message } from "@components/Message";
import { RadioPill, RadioPillOption } from "@components/RadioPill";
import { FIVE_MINUTES_IN_MS } from "@config/constants";
import { useIsBulkRenderingEntryVisible } from "@domains/bulkRendersRun/useIsBulkRenderingEntryVisible";
import { useIsOnboardingActive } from "@domains/onboarding/useIsOnboardingActive";
import { useCurrentSubscription } from "@domains/payment/useCurrentSubscription";
import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { useOpenNewUsersPaywall } from "@domains/payment/useOpenNewUsersPaywall";
import { useRelaxedLimitState } from "@domains/payment/useRelaxedLimitState";
import { isModelAllowedInRelaxedMode } from "@domains/payment/utils/isModelAllowedInRelaxedMode";
import { isSubscriptionKnownToLackAccess } from "@domains/payment/utils/isSubscriptionKnownToLackAccess";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useAdjustedFrameRange } from "@domains/renders/useAdjustedFrameRange";
import { useRefreshRendersInProgress } from "@domains/renders/useRefreshRendersInProgress";
import { useRenderDurationLimits } from "@domains/renders/useRenderDurationLimits";
import { useRendersInProgress } from "@domains/renders/useRendersInProgress";
import { useRenderSubmissionState } from "@domains/renders/useRenderSubmissionState";
import { isShotCroppedSectionOfInputVideo } from "@domains/renders/utils/cropRect";
import {
  FrameRangePreset,
  getActiveFrameRangePreset
} from "@domains/renders/utils/getActiveFrameRangePreset";
import { getInputVideoDimensions } from "@domains/renders/utils/getInputVideoDimensions";
import { getOneSecondRange } from "@domains/renders/utils/getOneSecondRange";
import { isCropCapableEngine } from "@domains/renders/utils/isCropCapableEngine";
import { RenderTarget } from "@domains/renders/utils/validateRenderPayload";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { useAddTrack } from "@domains/track/useAddTrack";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { useMockTrackDuringGeneration } from "@domains/track/useMockTrackDuringGeneration";
import { useFpsForShot } from "@domains/videoPlayer/useFpsForShot";
import { useFloating } from "@floating-ui/react";
import { PaymentAlertAddCredits } from "@home/components/PaymentAlertAddCredits";
import { PaymentUnlimitedAlert } from "@home/components/PaymentUnlimitedAlert";
import { useRelaxedAllowedModels } from "@hooks/payment/useRelaxedAllowedModels";
import { useFloatingRefCallbacks } from "@hooks/useFloatingRefCallbacks";
import { useTimeoutAlert } from "@hooks/useTimeoutAlert";
import { VideoSettings } from "@models/video/types";
import { activeHotkeyAtom, useInputTrackIdAtom } from "@store/atoms";
import { isPlayingAtom } from "@store/atoms/isPlayingAtom";
import { trackRangeAtom } from "@store/atoms/trackRangeAtom";
import { useShotCrop } from "@store/cropStore";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useToast } from "@store/useToast";
import { useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useTranslation } from "react-i18next";

import { useGetTrackById } from "@/domains/track/useGetTrackById";
import { useSetSelectedTrackIds } from "@/domains/track/useSetSelectedTrackIds";
import { queryKeys } from "@/queryKeys";

import { BulkRenderingFooterRow } from "./BulkRenderingFooterRow";
import { useSubmitVideoRender } from "./hooks/useSubmitVideoRender";

export const RenderBottom: React.FC = () => {
  const { t } = useTranslation();
  const {
    subscription,
    isModeToggleAvailable,
    doesSubscriptionGrantAccess,
    isLoading: isSubscriptionLoading
  } = useCurrentSubscription();
  const openNewUsersPaywall = useOpenNewUsersPaywall();
  const isPaywallEligible = isSubscriptionKnownToLackAccess({
    isSubscriptionLoading,
    doesSubscriptionGrantAccess
  });
  const relaxedAllowedModels = useRelaxedAllowedModels();
  const { refreshRendersInProgressIfNeeded } = useRefreshRendersInProgress();
  const { isUnlimitedModeActive } = useIsUnlimitedModeActive();
  const { activeLimit, resetAtSeconds, isRateLimited } = useRelaxedLimitState();
  const shotMaxFrames = useShotMaxFrames();
  const isOnboardingActive = useIsOnboardingActive();
  const {
    data: { videoTrack }
  } = useFilteredAndSortedTracks();

  const selectedProjectId = useSelectedProjectId();
  const { mockTrackDuringGeneration } = useMockTrackDuringGeneration();
  const activeScope = useAtomValue(activeHotkeyAtom);
  const { selectedShotId } = useSelectedShotId();
  const setIsPlaying = useSetAtom(isPlayingAtom);

  const { renderSettingsValuesAtom, selectedModelAtom, sourcesAtom } =
    useRenderSettingsAtoms();
  const sources = useAtomValue(sourcesAtom);
  const inputTrackIdAtom = useInputTrackIdAtom();
  const inputTrackId = useAtomValue(inputTrackIdAtom);
  const renderSettingsValues = useAtomValue(renderSettingsValuesAtom);
  const selectedModel = useAtomValue(selectedModelAtom);
  const { fps } = useFpsForShot();

  const { data: sourceTrack } = useGetTrackById({
    trackId: inputTrackId || videoTrack?.id,
    selectedProjectId,
    selectedShotId
  });

  const { submitVideoRender } = useSubmitVideoRender();
  const queryClient = useQueryClient();
  const { showToast, showHintToast } = useToast();
  const setSelectedTrackIds = useSetSelectedTrackIds();
  const { data: rendersInProgressData } = useRendersInProgress();

  const [disabledMessage, setDisabledMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const buttonsContainerRef = useRef<HTMLDivElement | null>(null);

  const unlimitedCurrentGenerationCount =
    rendersInProgressData?.unlimited?.video || 0;
  const simultaneousVideoRendersLimit =
    subscription?.features?.simultaneous_video_renders || 0;

  const shouldShowUnlimitedAlert = useTimeoutAlert({
    alertKey: "unlimitedAlertDismissedTime",
    timeoutMs: FIVE_MINUTES_IN_MS,
    shouldShowCondition:
      isUnlimitedModeActive &&
      unlimitedCurrentGenerationCount >= simultaneousVideoRendersLimit
  });

  const isModelNotAllowedInMode =
    isUnlimitedModeActive &&
    !isModelAllowedInRelaxedMode(relaxedAllowedModels, selectedModel.name);

  const fullClipRange: [number, number] = [0, shotMaxFrames];

  const { addTrack } = useAddTrack();

  const adjustedFrameRange = useAdjustedFrameRange();
  const trackRange = useAtomValue(trackRangeAtom);
  const setTrackRange = useSetAtom(trackRangeAtom);
  const [preRangeSnapshot, setPreRangeSnapshot] = useState<
    [number, number] | null
  >(null);

  const { modelHasTimeBasedDurationLimits } = useRenderDurationLimits();
  const supportsFrameRangePresets = !modelHasTimeBasedDurationLimits;
  const oneSecondRange = getOneSecondRange({
    start: adjustedFrameRange[0],
    fps,
    shotMaxFrames
  });
  const activePreset = supportsFrameRangePresets
    ? getActiveFrameRangePreset({
        range: adjustedFrameRange,
        fullClipRange,
        oneSecondRange
      })
    : null;

  const { range: rangeSubmission, fullClip: fullClipSubmission } =
    useRenderSubmissionState();

  const isFullPresetDisabled = fullClipSubmission.exceedsMaxRange;

  const frameRangePresetOptions: RadioPillOption<FrameRangePreset>[] = [
    {
      value: "full",
      label: t("actions.frame_range_preset_full.label"),
      isDisabled: isFullPresetDisabled,
      disabledReason: fullClipSubmission.maxRangeReason
    },
    {
      value: "oneSecond",
      label: t("actions.frame_range_preset_one_second.label")
    }
  ];

  const handlePresetDisabledPress = (preset: FrameRangePreset) => {
    if (preset === "full" && fullClipSubmission.maxRangeReason) {
      setDisabledMessage(fullClipSubmission.maxRangeReason);
    }
  };

  const handlePresetChange = (nextPreset: FrameRangePreset | null) => {
    if (nextPreset === null) {
      if (preRangeSnapshot) setTrackRange(preRangeSnapshot);
      setPreRangeSnapshot(null);
      return;
    }
    if (activePreset === null) {
      setPreRangeSnapshot(trackRange);
    }
    setTrackRange(nextPreset === "full" ? fullClipRange : oneSecondRange);
  };

  const isFullPresetSelected = activePreset === "full";
  const drivingSubmission = isFullPresetSelected
    ? fullClipSubmission
    : rangeSubmission;
  const drivingRange: [number, number] = isFullPresetSelected
    ? fullClipRange
    : adjustedFrameRange;
  const drivingTarget: RenderTarget = isFullPresetSelected
    ? "fullClip"
    : "range";

  const { inputVideoWidth, inputVideoHeight } =
    getInputVideoDimensions(sourceTrack);

  const startFrameNumber = adjustedFrameRange[0];
  const endFrameNumber = adjustedFrameRange[1];

  const hasEnoughCredits = rangeSubmission.estimate.hasEnoughCredits;

  const shouldShowAddCreditsAlert = useTimeoutAlert({
    alertKey: "creditsAlertDismissedTime",
    timeoutMs: FIVE_MINUTES_IN_MS,
    shouldShowCondition:
      !isOnboardingActive &&
      !isUnlimitedModeActive &&
      !hasEnoughCredits &&
      !isPaywallEligible
  });

  const { refs, floatingStyles } = useFloating({
    placement: "top"
  });
  const { setReferenceElement, setFloatingElement } =
    useFloatingRefCallbacks(refs);

  const formattedGenerationCost = toFixed(drivingSubmission.estimate.credits);

  const { crop } = useShotCrop();
  const isAreaRender =
    isShotCroppedSectionOfInputVideo({ crop }) &&
    isCropCapableEngine(selectedModel.name);

  const handleGenerateRender = (
    layerId: string,
    renderSettings: VideoSettings,
    range: number[],
    target: RenderTarget
  ): Promise<boolean> =>
    submitVideoRender({
      layerId,
      renderSettings,
      range,
      sources,
      model: selectedModel,
      inputTrackId: inputTrackId || videoTrack.id,
      inputVideoWidth,
      inputVideoHeight,
      fps,
      isUnlimitedModeActive,
      selectedProjectId,
      target,
      crop
    });

  const onGenerateRendersPress = async ({
    range,
    target,
    selectedProjectId
  }: {
    range: [number, number];
    target: RenderTarget;
    selectedProjectId: string | undefined;
    setSelectedTrackIds: (trackIds: string[]) => void;
    videoGenerationMode: "generate";
  }) => {
    setIsPlaying(false);
    if (!selectedProjectId) return;

    setIsGenerating(true);

    let track: Awaited<ReturnType<typeof addTrack>>;
    try {
      track = await addTrack({
        parentTrackOrder: sourceTrack?.layer_order
      });
    } catch (error) {
      console.error("Failed to create track:", error);
      showToast({
        message: t("notifications.failed_to_create_track.description")
      });
      setIsGenerating(false);
      return;
    }

    if (!track) {
      showToast({
        message: t("notifications.failed_to_create_track.description")
      });
      setIsGenerating(false);
      return;
    }

    mockTrackDuringGeneration({
      track,
      frameRange: range,
      renderSettingsValues,
      inputTrackId: inputTrackId || videoTrack.id,
      fps
    });

    showToast({
      message: t("notifications.render_queue_confirmation.description"),
      onCancelText: t("notifications.render_queue_confirmation.cancel"),
      onCancel: () => {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.project.byId(selectedProjectId)
        });
        setIsGenerating(false);
      },
      onSubmit: async () => {
        try {
          const didSubmit = await handleGenerateRender(
            track.id,
            renderSettingsValues,
            range,
            target
          );

          if (!didSubmit) return;

          showHintToast(t("hints.privacy_notice"));
        } finally {
          setIsGenerating(false);
        }
      },
      onSubmitText: t("notifications.render_queue_confirmation.submit"),
      invertedSubmitAndCancelColors: true
    });

    void refreshRendersInProgressIfNeeded();
  };

  const isGenerateButtonDisabled =
    !drivingSubmission.canSubmit && !drivingSubmission.isBlockedByCreditPaywall;
  const isGenerateActionUnavailable = isGenerateButtonDisabled || isGenerating;

  const isBulkRenderingRowVisible =
    useIsBulkRenderingEntryVisible(selectedModel);

  const pressGenerate = () => {
    if (drivingSubmission.isBlockedByCreditPaywall) {
      openNewUsersPaywall();
      return;
    }
    void onGenerateRendersPress({
      range: drivingRange,
      target: drivingTarget,
      selectedProjectId,
      setSelectedTrackIds,
      videoGenerationMode: "generate"
    });
  };

  useHotkeys(
    "mod+enter",
    () => {
      if (!isGenerateButtonDisabled && !isGenerating) {
        pressGenerate();
      }
    },
    {
      preventDefault: true,
      enableOnFormTags: false,
      enabled: !isGenerateButtonDisabled && activeScope === "projectView"
    },
    [
      isGenerateButtonDisabled,
      isGenerating,
      drivingRange,
      drivingTarget,
      selectedProjectId,
      setSelectedTrackIds,
      activeScope
    ]
  );

  return (
    <div className="relative h-fit w-full shrink-0 border-t border-glyph-invert-main bg-surface-secondary-opacity-90">
      {isRateLimited && (
        <PaymentUnlimitedAlert
          floatingStyles={floatingStyles}
          ref={setFloatingElement}
          variant="panel"
          reason={activeLimit ?? undefined}
          resetAtSeconds={resetAtSeconds}
        />
      )}

      {!isRateLimited && shouldShowUnlimitedAlert && (
        <PaymentUnlimitedAlert
          floatingStyles={floatingStyles}
          ref={setFloatingElement}
          variant="panel"
          limit={simultaneousVideoRendersLimit}
        />
      )}

      {!isRateLimited && shouldShowAddCreditsAlert && (
        <PaymentAlertAddCredits
          floatingStyles={floatingStyles}
          ref={setFloatingElement}
          variant="panel"
          isUnlimitedAvailable={isModeToggleAvailable}
        />
      )}

      {!isRateLimited && isModelNotAllowedInMode && (
        <div className="w-full p-3 pb-1">
          <Alert alertVariant="warning" canClose={false}>
            {t(
              "notifications.payment_flow_relaxed_mode_model_restriction.description"
            )}
          </Alert>
        </div>
      )}

      <div className="relative w-full">
        <div className="relative p-3 pointer-events-auto">
          <div className="relative flex flex-col justify-between gap-2">
            <div
              ref={buttonsContainerRef}
              className="flex items-center shrink-0 gap-2 w-full"
              data-onboarding-id="pf-generate-render"
            >
              {supportsFrameRangePresets && (
                <RadioPill
                  options={frameRangePresetOptions}
                  value={activePreset}
                  onChange={handlePresetChange}
                  onDisabledPress={handlePresetDisabledPress}
                  className="shrink-0"
                  aria-label={t("actions.frame_range_preset_group.ariaLabel")}
                />
              )}

              <div className="flex-1 basis-0">
                <MainButton
                  isDisabled={isGenerateActionUnavailable}
                  loading={isGenerating}
                  fullWidth
                  onPress={pressGenerate}
                  onDisabledPress={() => {
                    if (drivingSubmission.disabledReason) {
                      setDisabledMessage(drivingSubmission.disabledReason);
                    }
                  }}
                  title={drivingSubmission.disabledReason}
                  aria-label="Stylize the video"
                >
                  {t(
                    isAreaRender
                      ? "actions.run_stylization_area.label"
                      : "actions.run_stylization.label",
                    { startFrameNumber, endFrameNumber }
                  )}
                  {!isUnlimitedModeActive && (
                    <CreditCoin
                      count={formattedGenerationCost}
                      disabled={isGenerateButtonDisabled}
                      marginLeft
                      monochrome
                    />
                  )}
                </MainButton>
              </div>

              {disabledMessage && (
                <Message
                  variant="warning"
                  duration={3000}
                  onDismiss={() => setDisabledMessage(null)}
                  anchorRef={buttonsContainerRef}
                  placement="top"
                  offset={4}
                >
                  {disabledMessage}
                </Message>
              )}
            </div>

            {isBulkRenderingRowVisible && (
              <BulkRenderingFooterRow
                isApplySettingsDisabled={isGenerateActionUnavailable}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
