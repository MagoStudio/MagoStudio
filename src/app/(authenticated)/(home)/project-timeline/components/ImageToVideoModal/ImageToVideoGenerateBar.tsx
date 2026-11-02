import { Alert } from "@components/Alert";
import { CreditCoin } from "@components/CreditCoin";
import { MainButton } from "@components/MainButton";
import { Message } from "@components/Message";
import { useIsOnboardingActive } from "@domains/onboarding/useIsOnboardingActive";
import { useBalance } from "@domains/payment/useBalance";
import { useCurrentSubscription } from "@domains/payment/useCurrentSubscription";
import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { useOpenNewUsersPaywall } from "@domains/payment/useOpenNewUsersPaywall";
import { isModelAllowedInRelaxedMode } from "@domains/payment/utils/isModelAllowedInRelaxedMode";
import { getFrameRangeLength } from "@domains/renders/utils/getFrameRangeLength";
import {
  IMAGE_TO_VIDEO_CONTAINER_SHOT_NAME,
  useImageToVideoContainerShot
} from "@domains/shot/useImageToVideoContainerShot";
import { useAddTrack } from "@domains/track/useAddTrack";
import { GenerateButtonCostLabel } from "@home/components/SettingsEditor/GenerateButtonCostLabel";
import { useEnsureLocalVideoRenderPreconditions } from "@home/components/SettingsEditor/hooks/useEnsureLocalVideoRenderPreconditions";
import { useRelaxedAllowedModels } from "@hooks/payment/useRelaxedAllowedModels";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useToast } from "@store/useToast";
import { useAtomValue } from "jotai";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { resolveRenderProvider } from "@/platform/renderTarget";

import { useMockImageToVideoTrackDuringGeneration } from "./hooks/useMockImageToVideoTrackDuringGeneration";
import { useSubmitImageToVideoRender } from "./hooks/useSubmitImageToVideoRender";
import { deriveImageToVideoFrameRange } from "./utils/deriveImageToVideoFrameRange";
import { evaluateImageToVideoCreditGate } from "./utils/evaluateImageToVideoCreditGate";
import { getImageToVideoValidationErrorMessage } from "./utils/getImageToVideoValidationErrorMessage";
import { resolveImageToVideoDisabledReason } from "./utils/resolveImageToVideoDisabledReason";

const DEFAULT_FPS = 24;
const DEFAULT_DURATION_IN_SECONDS = 5;
const INSUFFICIENT_CREDITS_REASON_KEY =
  "notifications.payment_flow_enough_coins.description";

interface ImageToVideoGenerateBarProps {
  selectedProjectId: string | undefined;
}

export const ImageToVideoGenerateBar: React.FC<
  ImageToVideoGenerateBarProps
> = ({ selectedProjectId }) => {
  const { t } = useTranslation();
  const { renderSettingsValuesAtom, selectedModelAtom } =
    useRenderSettingsAtoms();
  const values = useAtomValue(renderSettingsValuesAtom);
  const selectedModel = useAtomValue(selectedModelAtom);
  const { isUnlimitedModeActive } = useIsUnlimitedModeActive();
  const relaxedAllowedModels = useRelaxedAllowedModels();
  const { data: balanceData } = useBalance();
  const { doesSubscriptionGrantAccess, isLoading: isSubscriptionLoading } =
    useCurrentSubscription();
  const isOnboardingActive = useIsOnboardingActive();
  const openNewUsersPaywall = useOpenNewUsersPaywall();
  const { containerShotId, ensureContainerShotId } =
    useImageToVideoContainerShot(selectedProjectId);
  const { addTrack } = useAddTrack();
  const { showToast } = useToast();
  const { submitImageToVideoRender } = useSubmitImageToVideoRender();
  const { ensureLocalVideoRenderPreconditions } =
    useEnsureLocalVideoRenderPreconditions();
  const { mockImageToVideoTrackDuringGeneration } =
    useMockImageToVideoTrackDuringGeneration({ selectedProjectId });
  const [isGenerating, setIsGenerating] = useState(false);
  const [disabledMessage, setDisabledMessage] = useState<string | null>(null);
  const buttonsContainerRef = useRef<HTMLDivElement | null>(null);

  const durationInSeconds =
    typeof values.durationInSeconds === "number"
      ? values.durationInSeconds
      : DEFAULT_DURATION_IN_SECONDS;
  const fps = typeof values.fps === "number" ? values.fps : DEFAULT_FPS;

  const validationErrorMessage = getImageToVideoValidationErrorMessage(
    selectedModel,
    values
  );

  const isModelNotAllowedInMode =
    isUnlimitedModeActive &&
    !isModelAllowedInRelaxedMode(relaxedAllowedModels, selectedModel.name);

  const frameRange = deriveImageToVideoFrameRange(durationInSeconds, fps);
  const frameRangeLength = getFrameRangeLength(frameRange);
  const { impactToShow } = selectedModel.calcEstimatedRenderTime(
    values,
    frameRangeLength
  );
  const renderProvider = resolveRenderProvider(selectedModel.name);
  const isRenderedOnUsersOwnProvider = renderProvider === "local-comfy";
  const {
    isRenderBlockedByInsufficientCredits,
    isRenderBlockedByCreditPaywall
  } = evaluateImageToVideoCreditGate({
    renderProvider,
    isCreditBalanceKnown: balanceData !== undefined,
    isOnboardingActive,
    isUnlimitedModeActive,
    userCredits: balanceData?.amount ?? 0,
    requiredCredits: impactToShow,
    isSubscriptionLoading,
    doesSubscriptionGrantAccess
  });

  const formOrModeDisabledReason = resolveImageToVideoDisabledReason({
    hasSelectedProject: !!selectedProjectId,
    validationErrorMessage,
    isModelNotAllowedInMode,
    missingProjectMessage: t(
      "projectTimeline.imageToVideo.disabledReason.missingProject.label"
    ),
    modelNotAllowedInModeMessage: t(
      "notifications.payment_flow_relaxed_mode_model_restriction.description"
    )
  });
  const disabledReason =
    formOrModeDisabledReason ??
    (isRenderBlockedByInsufficientCredits
      ? t(INSUFFICIENT_CREDITS_REASON_KEY)
      : undefined);

  const isGenerateButtonDisabled =
    !selectedProjectId ||
    !!validationErrorMessage ||
    isModelNotAllowedInMode ||
    isRenderBlockedByInsufficientCredits ||
    isGenerating;

  const handleGenerate = async () => {
    if (!selectedProjectId) return;
    if (isRenderBlockedByCreditPaywall) {
      openNewUsersPaywall();
      return;
    }

    setIsGenerating(true);
    try {
      const areLocalRenderPreconditionsMet =
        await ensureLocalVideoRenderPreconditions({
          model: selectedModel.name,
          renderSettingsValues: values
        });
      if (!areLocalRenderPreconditionsMet) return;

      const resolvedContainerShotId =
        containerShotId ?? (await ensureContainerShotId());
      if (!resolvedContainerShotId) return;

      let track: Awaited<ReturnType<typeof addTrack>>;
      try {
        track = await addTrack({
          shotIdOverride: resolvedContainerShotId,
          shotNameWhenMissingFromCache: IMAGE_TO_VIDEO_CONTAINER_SHOT_NAME
        });
      } catch (error) {
        console.error("Failed to create track:", error);
        showToast({
          message: t("notifications.failed_to_create_track.description")
        });
        return;
      }
      if (!track) {
        showToast({
          message: t("notifications.failed_to_create_track.description")
        });
        return;
      }

      mockImageToVideoTrackDuringGeneration({
        track,
        frameRange,
        renderSettingsValues: values,
        containerShotId: resolvedContainerShotId,
        fps
      });

      await submitImageToVideoRender({
        layerId: track.id,
        renderSettings: values,
        durationInSeconds,
        fps,
        model: selectedModel,
        selectedProjectId
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 border-t border-glyph-invert-main p-3">
      {isModelNotAllowedInMode && (
        <Alert alertVariant="warning" canClose={false}>
          {t(
            "notifications.payment_flow_relaxed_mode_model_restriction.description"
          )}
        </Alert>
      )}
      <div ref={buttonsContainerRef} className="relative w-full">
        <MainButton
          isDisabled={isGenerateButtonDisabled}
          loading={isGenerating}
          fullWidth
          onPress={handleGenerate}
          onDisabledPress={() => {
            if (disabledReason) setDisabledMessage(disabledReason);
          }}
          title={disabledReason}
        >
          {t("projectTimeline.imageToVideo.generateButton.label")}
          {isRenderedOnUsersOwnProvider ? (
            <GenerateButtonCostLabel
              renderProvider={renderProvider}
              formattedCreditCost={String(impactToShow)}
              isUnlimitedModeActive={isUnlimitedModeActive}
              isGenerateButtonDisabled={isGenerateButtonDisabled}
            />
          ) : (
            !isUnlimitedModeActive && (
              <CreditCoin
                count={impactToShow}
                disabled={isGenerateButtonDisabled}
                marginLeft
              />
            )
          )}
        </MainButton>
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
    </div>
  );
};
