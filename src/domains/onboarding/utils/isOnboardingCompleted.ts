import { OnboardingStatus } from "@schemas/balance";

export const isOnboardingCompleted = (
  onboarding: OnboardingStatus | null | undefined
): boolean => onboarding?.completed === true;
