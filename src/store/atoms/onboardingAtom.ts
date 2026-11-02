import { atom } from "jotai";

export type OnboardingStep =
  | "questionnaire"
  | "upload"
  | "generate-image"
  | "select-image"
  | "render"
  | "tutorial"
  | "complete";

export interface OnboardingProgress {
  step: OnboardingStep;
  selectedImageAssetId?: string;
  renderSubmitted?: boolean;
}

export const INITIAL_ONBOARDING_PROGRESS: OnboardingProgress = {
  step: "questionnaire"
};

export const ONBOARDING_PROJECT_STEPS: OnboardingStep[] = [
  "generate-image",
  "select-image",
  "render",
  "tutorial"
];

export const onboardingProgressAtom = atom<OnboardingProgress>(
  INITIAL_ONBOARDING_PROGRESS
);
