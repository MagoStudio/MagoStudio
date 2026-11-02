import { Alert } from "@components/Alert";
import { CreditCoin } from "@components/CreditCoin";
import { MainButton } from "@components/MainButton";
import { Message } from "@components/Message";
import { FIVE_MINUTES_IN_MS } from "@config/constants";
import { getAssetDimensions } from "@domains/asset/utils/getAssetDimensions";
import { useIsOnboardingActive } from "@domains/onboarding/useIsOnboardingActive";
import { useIsOnboardingImageCapReached } from "@domains/onboarding/useIsOnboardingImageCapReached";
import { useBalance } from "@domains/payment/useBalance";
import { useCurrentSubscription } from "@domains/payment/useCurrentSubscription";
import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { useRelaxedLimitState } from "@domains/payment/useRelaxedLimitState";
import { isModelAllowedInRelaxedMode } from "@domains/payment/utils/isModelAllowedInRelaxedMode";
import { useRendersInProgress } from "@domains/renders/useRendersInProgress";
import { useInputTrack } from "@domains/track/useInputTrack";
import { useInputTrackFrameSrc } from "@domains/track/useInputTrackFrameSrc";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { useFloating, offset } from "@floating-ui/react";
import { useRelaxedAllowedModels } from "@hooks/payment/useRelaxedAllowedModels";
import { useFloatingRefCallbacks } from "@hooks/useFloatingRefCallbacks";
import { useTimeoutAlert } from "@hooks/useTimeoutAlert";
import { cn } from "@utils";
import { useAtomValue } from "jotai";
import React, { useRef } from "react";
import { useFormState, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { resolveImageRenderProvider } from "@/platform/renderTarget";

import { PaymentAlertAddCredits } from "../../PaymentAlertAddCredits";
import { PaymentUnlimitedAlert } from "../../PaymentUnlimitedAlert";

import { getAdapter } from "./adapters";
import { drawMaskActiveAtom } from "./DrawMask/drawMaskAtom";
import { Img2ImgType } from "./schemas";
import { Seedream5ProType } from "./schemas/seedream5Pro.schema";
import { hasImg2ImgInputImage } from "./utils/hasImg2ImgInputImage";

const OFFSET = 20;

type GenerateButtonProps = {
  label?: string;
  currentFrame: number;
};

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  label,
  currentFrame
}) => {
  const { t } = useTranslation();
  const { isSubmitting, isValid } = useFormState();
  const { data: balanceData } = useBalance();
  const { isUnlimitedModeActive } = useIsUnlimitedModeActive();
  const { data: rendersInProgressData } = useRendersInProgress();
  const { subscription, isModeToggleAvailable } = useCurrentSubscription();
  const relaxedAllowedModels = useRelaxedAllowedModels();
  const { activeLimit, resetAtSeconds, isRateLimited } = useRelaxedLimitState();
  const { refs, floatingStyles } = useFloating({
    placement: "top",
    middleware: [offset(OFFSET)]
  });
  const { setReferenceElement, setFloatingElement } =
    useFloatingRefCallbacks(refs);
  const containerRef = useRef<HTMLElement | null>(null);
  const values = useWatch<Img2ImgType>() as Img2ImgType;
  const isOnboardingActive = useIsOnboardingActive();
  const onboardingCapReached = useIsOnboardingImageCapReached();
  const { inputTrackFrameSrc, error: inputTrackFrameError } =
    useInputTrackFrameSrc({
      frameNumber: currentFrame,
      enabled: values.frameType === "video"
    });
  const { inputTrack } = useInputTrack();
  const { width = 0, height = 0 } = getAssetDimensions(
    getTrackAssetData(inputTrack)
  );
  const maskLayerDataUrl = useWatch<Seedream5ProType, "maskLayerDataUrl">({
    name: "maskLayerDataUrl"
  });
  const maskedFrameSrc = useWatch<Seedream5ProType, "maskedFrameSrc">({
    name: "maskedFrameSrc"
  });
  const isInputImageUnresolved = !hasImg2ImgInputImage({
    frameType: values.frameType,
    maskLayerDataUrl,
    maskedFrameSrc,
    inputTrackFrameSrc
  });
  const isInputFrameLoadErrored =
    Boolean(inputTrackFrameError) && isInputImageUnresolved;

  const adapter = getAdapter(values);
  const generationCost = Math.ceil(adapter.computeCost(values));
  const renderProvider = resolveImageRenderProvider(values.model);
  const usesMagoCredits = renderProvider === "mago-cloud";
  const userCreditsCount = balanceData?.amount || 0;
  const hasEnoughCreditsForImg2img =
    !usesMagoCredits || userCreditsCount >= generationCost;
  const unlimitedCurrentCount = rendersInProgressData?.unlimited?.img2img || 0;
  const simultaneousRendersLimit =
    subscription?.features?.simultaneous_image_renders || 0;

  const shouldShowAddCreditsAlert = useTimeoutAlert({
    alertKey: "creditsAlertDismissedTime",
    timeoutMs: FIVE_MINUTES_IN_MS,
    shouldShowCondition:
      !isOnboardingActive &&
      usesMagoCredits &&
      !isUnlimitedModeActive &&
      !hasEnoughCreditsForImg2img
  });
  const shouldShowUnlimitedAlert = useTimeoutAlert({
    alertKey: "unlimitedAlertDismissedTime",
    timeoutMs: FIVE_MINUTES_IN_MS,
    shouldShowCondition:
      !isOnboardingActive &&
      usesMagoCredits &&
      isUnlimitedModeActive &&
      unlimitedCurrentCount >= simultaneousRendersLimit
  });

  const isUnavailableModelInRelaxedMode =
    !isOnboardingActive &&
    usesMagoCredits &&
    isUnlimitedModeActive &&
    !isModelAllowedInRelaxedMode(relaxedAllowedModels, values.model);

  const isDrawMaskActive = useAtomValue(drawMaskActiveAtom);

  const paymentGatesDisabled = isOnboardingActive
    ? onboardingCapReached
    : usesMagoCredits &&
      ((!hasEnoughCreditsForImg2img && !isUnlimitedModeActive) ||
        (isUnlimitedModeActive &&
          unlimitedCurrentCount >= simultaneousRendersLimit) ||
        isUnavailableModelInRelaxedMode);

  const isOnboardingPromptEmpty = isOnboardingActive && !values.prompt?.trim();

  const isGenerateButtonDisabled =
    paymentGatesDisabled ||
    isSubmitting ||
    !isValid ||
    (!isOnboardingActive && usesMagoCredits && isRateLimited) ||
    isDrawMaskActive ||
    isOnboardingPromptEmpty ||
    isInputImageUnresolved;

  return (
    <div
      className="relative flex-1"
      ref={(node) => {
        setReferenceElement(node);
        containerRef.current = node;
      }}
    >
      <MainButton
        data-testid="generate-button"
        isDisabled={isGenerateButtonDisabled}
        fullWidth
        loading={isSubmitting}
        type="submit"
        aria-label="Generate image"
      >
        {label ?? t("actions.generate_image.label")}
        {!isUnlimitedModeActive && !isOnboardingActive && usesMagoCredits && (
          <CreditCoin
            count={generationCost}
            disabled={isGenerateButtonDisabled}
            marginLeft
            color={
              !hasEnoughCreditsForImg2img && !isUnlimitedModeActive
                ? "glyph-error"
                : "glyph-primary"
            }
            icon={
              !hasEnoughCreditsForImg2img && !isUnlimitedModeActive
                ? "out"
                : "default"
            }
          />
        )}
        {!isOnboardingActive && renderProvider === "local-comfy" && (
          <span className="ml-2 text-xs opacity-70">Local</span>
        )}
      </MainButton>
      {isDrawMaskActive && (
        <Message variant="warning" placement="top" anchorRef={containerRef}>
          {t("img2imgForms.draw_mask.save_mask_to_continue")}
        </Message>
      )}
      {isInputFrameLoadErrored && (
        <Message variant="error" placement="top" anchorRef={containerRef}>
          {t("img2imgForms.common.input_frame_loading_error.label")}
        </Message>
      )}
      {usesMagoCredits && isRateLimited && (
        <PaymentUnlimitedAlert
          floatingStyles={floatingStyles}
          ref={setFloatingElement}
          variant="img2img"
          reason={activeLimit ?? undefined}
          resetAtSeconds={resetAtSeconds}
        />
      )}
      {usesMagoCredits && !isRateLimited && shouldShowUnlimitedAlert && (
        <PaymentUnlimitedAlert
          floatingStyles={floatingStyles}
          ref={setFloatingElement}
          variant="img2img"
          limit={simultaneousRendersLimit}
        />
      )}
      {usesMagoCredits && !isRateLimited && shouldShowAddCreditsAlert && (
        <PaymentAlertAddCredits
          floatingStyles={floatingStyles}
          ref={setFloatingElement}
          variant="img2img"
          isUnlimitedAvailable={isModeToggleAvailable}
        />
      )}
      {usesMagoCredits && !isRateLimited && isUnavailableModelInRelaxedMode && (
        <div className="w-full" ref={setFloatingElement} style={floatingStyles}>
          <div
            className={cn(
              "w-full max-w-full whitespace-normal break-words [&_*]:min-w-0"
            )}
          >
            <Alert alertVariant="warning" canClose={false}>
              {t(
                adapter.relaxedModeRestrictionKey ??
                  "notifications.payment_flow_relaxed_mode_model_restriction.description"
              )}
            </Alert>
          </div>
        </div>
      )}
    </div>
  );
};
