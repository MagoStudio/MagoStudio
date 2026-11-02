export type OnboardingGuardAction =
  | "none"
  | "resume-in-place"
  | "enter-onboarding"
  | "exit-onboarding"
  | "clear-onboarding-param";

interface GuardInput {
  isOnboardingRoute: boolean;
  isOnboardingProjectPath: boolean;
  stepIsProjectStep: boolean;
  justCompleted: boolean;
  hasProjectId: boolean;
  needsOnboarding: boolean | undefined;
}

export const resolveOnboardingGuardAction = ({
  isOnboardingRoute,
  isOnboardingProjectPath,
  stepIsProjectStep,
  justCompleted,
  hasProjectId,
  needsOnboarding
}: GuardInput): OnboardingGuardAction => {
  if (justCompleted) return "none";

  const isInOnboarding = isOnboardingRoute || isOnboardingProjectPath;
  const isReloadedOnboardingProjectPath =
    isOnboardingProjectPath && !stepIsProjectStep;

  if (needsOnboarding === true) {
    if (isReloadedOnboardingProjectPath && hasProjectId) {
      return "resume-in-place";
    }
    if (!isInOnboarding || isReloadedOnboardingProjectPath) {
      return "enter-onboarding";
    }
    return "none";
  }

  if (needsOnboarding === false && isOnboardingRoute) {
    return "exit-onboarding";
  }

  if (needsOnboarding === false && isReloadedOnboardingProjectPath) {
    return "clear-onboarding-param";
  }

  return "none";
};
