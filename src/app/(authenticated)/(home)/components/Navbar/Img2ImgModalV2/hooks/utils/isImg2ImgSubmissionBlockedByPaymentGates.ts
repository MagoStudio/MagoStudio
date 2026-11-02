import { RenderProvider } from "@/platform/modelProviders";

export const isImg2ImgSubmissionBlockedByPaymentGates = ({
  renderProvider,
  hasEnoughCreditsForImg2img,
  isUnlimitedModeActive,
  isOnboardingActive,
  isOnboardingImageCapReached
}: {
  renderProvider: RenderProvider | null;
  hasEnoughCreditsForImg2img: boolean;
  isUnlimitedModeActive: boolean;
  isOnboardingActive: boolean;
  isOnboardingImageCapReached: boolean;
}): boolean => {
  const isBilledInMagoCredits = renderProvider === "mago-cloud";
  if (!isBilledInMagoCredits) return false;

  const isBlockedByInsufficientCredits =
    !hasEnoughCreditsForImg2img &&
    !isUnlimitedModeActive &&
    !isOnboardingActive;

  return isBlockedByInsufficientCredits || isOnboardingImageCapReached;
};
