import { useIsOnboardingActive } from "@domains/onboarding/useIsOnboardingActive";
import { useOnboardingProgress } from "@domains/onboarding/useOnboardingProgress";

import { OnboardingRenderModal } from "./OnboardingRenderModal";

export const OnboardingRenderModalHost = (): React.ReactNode => {
  const isOnboardingActive = useIsOnboardingActive();
  const [{ step }] = useOnboardingProgress();

  if (step !== "render" || !isOnboardingActive) return null;

  return <OnboardingRenderModal />;
};
