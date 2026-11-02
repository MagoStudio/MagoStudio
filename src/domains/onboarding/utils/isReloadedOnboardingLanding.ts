import {
  ONBOARDING_PROJECT_STEPS,
  OnboardingStep
} from "@store/atoms/onboardingAtom";

export interface OnboardingLandingInputs {
  isOnboardingProjectPath: boolean;
  step: OnboardingStep;
}

export const isReloadedOnboardingLanding = ({
  isOnboardingProjectPath,
  step
}: OnboardingLandingInputs): boolean =>
  isOnboardingProjectPath &&
  !ONBOARDING_PROJECT_STEPS.includes(step) &&
  step !== "complete";
