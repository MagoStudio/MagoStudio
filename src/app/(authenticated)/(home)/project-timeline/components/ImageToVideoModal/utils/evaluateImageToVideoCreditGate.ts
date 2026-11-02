import { isRenderEligibleForCreditPaywall } from "@domains/renders/utils/isRenderEligibleForCreditPaywall";

import { RenderProvider } from "@/platform/modelProviders";

export const evaluateImageToVideoCreditGate = ({
  renderProvider,
  isCreditBalanceKnown,
  isOnboardingActive,
  isUnlimitedModeActive,
  userCredits,
  requiredCredits,
  isSubscriptionLoading,
  doesSubscriptionGrantAccess
}: {
  renderProvider: RenderProvider | null;
  isCreditBalanceKnown: boolean;
  isOnboardingActive: boolean;
  isUnlimitedModeActive: boolean;
  userCredits: number;
  requiredCredits: number;
  isSubscriptionLoading: boolean;
  doesSubscriptionGrantAccess: boolean;
}): {
  isRenderBlockedByInsufficientCredits: boolean;
  isRenderBlockedByCreditPaywall: boolean;
} => {
  const doesCreditCheckApplyToRender =
    renderProvider === "mago-cloud" &&
    isCreditBalanceKnown &&
    !isOnboardingActive &&
    !isUnlimitedModeActive;
  const hasEnoughCredits = userCredits >= requiredCredits;
  const isRenderBlockedOnlyByCredits =
    doesCreditCheckApplyToRender && !hasEnoughCredits;
  const isRenderBlockedByCreditPaywall =
    isRenderBlockedOnlyByCredits &&
    isRenderEligibleForCreditPaywall({
      renderProvider,
      isSubscriptionLoading,
      doesSubscriptionGrantAccess
    });

  return {
    isRenderBlockedByInsufficientCredits:
      isRenderBlockedOnlyByCredits && !isRenderBlockedByCreditPaywall,
    isRenderBlockedByCreditPaywall
  };
};
