import { useIsReferenceImageUploading } from "@context/IsReferenceImageUploading";
import { useIsOnboardingActive } from "@domains/onboarding/useIsOnboardingActive";
import { useBalance } from "@domains/payment/useBalance";
import { useCurrentSubscription } from "@domains/payment/useCurrentSubscription";
import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { useRelaxedLimitState } from "@domains/payment/useRelaxedLimitState";
import { isModelAllowedInRelaxedMode } from "@domains/payment/utils/isModelAllowedInRelaxedMode";
import { isSubscriptionKnownToLackAccess } from "@domains/payment/utils/isSubscriptionKnownToLackAccess";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useRendersInProgress } from "@domains/renders/useRendersInProgress";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { getTimelineOffset } from "@domains/track/utils/frameCoordinates";
import { useFpsForShot } from "@domains/videoPlayer/useFpsForShot";
import { useRelaxedAllowedModels } from "@hooks/payment/useRelaxedAllowedModels";
import { useInputTrackIdAtom } from "@store/atoms";
import { useShotCrop } from "@store/cropStore";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

import { useGetTrackById } from "@/domains/track/useGetTrackById";

import { useAdjustedFrameRange } from "./useAdjustedFrameRange";
import { useRenderDurationLimits } from "./useRenderDurationLimits";
import { useRenderImageDimensions } from "./useRenderImageDimensions";
import {
  evaluateRenderSubmission,
  RenderSubmissionTargetState
} from "./utils/evaluateRenderSubmission";
import { getInputVideoDimensions } from "./utils/getInputVideoDimensions";
import { getMaskTrack } from "./utils/getMaskTrack";

interface SubmissionState {
  canSubmit: boolean;
  disabledReason: string | undefined;
  isBlockedByCreditPaywall: boolean;
  exceedsMaxRange: boolean;
  maxRangeReason: string | undefined;
  estimate: {
    credits: number;
    hasEnoughCredits: boolean;
  };
}

export interface RenderSubmissionState {
  range: SubmissionState;
  fullClip: SubmissionState;
}

export const useRenderSubmissionState = (): RenderSubmissionState => {
  const { t } = useTranslation();
  const { data: balanceData } = useBalance();
  const {
    subscription,
    doesSubscriptionGrantAccess,
    isLoading: isSubscriptionLoading
  } = useCurrentSubscription();
  const relaxedAllowedModels = useRelaxedAllowedModels();
  const { isUnlimitedModeActive } = useIsUnlimitedModeActive();
  const { isRateLimited } = useRelaxedLimitState();
  const isOnboardingActive = useIsOnboardingActive();
  const { isReferenceImageUploading } = useIsReferenceImageUploading();
  const { data: rendersInProgressData } = useRendersInProgress();
  const shotMaxFrames = useShotMaxFrames();
  const { fps } = useFpsForShot();
  const durationLimits = useRenderDurationLimits();
  const adjustedFrameRange = useAdjustedFrameRange();

  const { renderSettingsValuesAtom, selectedModelAtom, sourcesAtom } =
    useRenderSettingsAtoms();
  const renderSettingsValues = useAtomValue(renderSettingsValuesAtom);
  const selectedModel = useAtomValue(selectedModelAtom);
  const sources = useAtomValue(sourcesAtom);
  const inputTrackIdAtom = useInputTrackIdAtom();
  const inputTrackId = useAtomValue(inputTrackIdAtom);

  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();
  const {
    data: { videoTrack, tracks }
  } = useFilteredAndSortedTracks();
  const { data: sourceTrack } = useGetTrackById({
    trackId: inputTrackId || videoTrack?.id,
    selectedProjectId,
    selectedShotId
  });

  const { inputVideoWidth, inputVideoHeight } =
    getInputVideoDimensions(sourceTrack);

  const imageDimensions = useRenderImageDimensions();

  const maskTrack = getMaskTrack(renderSettingsValues, tracks);
  const { crop } = useShotCrop();

  const isModelAllowedInMode =
    !isUnlimitedModeActive ||
    isModelAllowedInRelaxedMode(relaxedAllowedModels, selectedModel.name);

  const result = evaluateRenderSubmission({
    model: selectedModel,
    renderSettingsValues,
    sources,
    fps,
    isUnlimitedModeActive,
    inputVideoWidth,
    inputVideoHeight,
    imageDimensions,
    rangeFrames: adjustedFrameRange,
    fullClipRange: [0, shotMaxFrames],
    durationLimits,
    maskTrack,
    sourceTrackTimelineOffset: getTimelineOffset(sourceTrack),
    crop,
    tracks,
    isModelAllowedInMode,
    isRateLimited,
    isReferenceImageUploading,
    simultaneousVideoRendersLimit:
      subscription?.features?.simultaneous_video_renders || 0,
    unlimitedCurrentGenerationCount:
      rendersInProgressData?.unlimited?.video || 0,
    userCredits: balanceData?.amount || 0,
    skipCreditCheck: isOnboardingActive,
    isPaywallEligible: isSubscriptionKnownToLackAccess({
      isSubscriptionLoading,
      doesSubscriptionGrantAccess
    })
  });

  const translateReasonKey = (reasonKey: string | undefined) =>
    reasonKey
      ? t(reasonKey, {
          minSeconds: durationLimits.minSeconds,
          maxSeconds: durationLimits.maxSeconds,
          minDefault: durationLimits.minFrames,
          minFrames: durationLimits.minFrames,
          maxFrames: durationLimits.maxFrames,
          maxCredits: durationLimits.maxFrames
        })
      : undefined;

  const toSubmissionState = (
    target: RenderSubmissionTargetState
  ): SubmissionState => ({
    canSubmit: target.canSubmit,
    disabledReason: translateReasonKey(target.disabledReasonKey),
    isBlockedByCreditPaywall: target.isBlockedByCreditPaywall,
    exceedsMaxRange: target.exceedsMaxRange,
    maxRangeReason: translateReasonKey(target.maxRangeReasonKey),
    estimate: {
      credits: target.estimateCredits,
      hasEnoughCredits: target.hasEnoughCredits
    }
  });

  return {
    range: toSubmissionState(result.range),
    fullClip: toSubmissionState(result.fullClip)
  };
};
