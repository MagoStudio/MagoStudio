import { useOnboardingProgress } from "@domains/onboarding/useOnboardingProgress";

import { OnboardingTutorialModal } from "./OnboardingTutorialModal";

export const OnboardingTutorialModalHost = (): React.ReactNode => {
  const [{ step }] = useOnboardingProgress();

  if (step !== "tutorial") return null;

  return <OnboardingTutorialModal />;
};
