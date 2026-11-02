import { OnboardingStep } from "@store/atoms/onboardingAtom";

export const resolveResumeStep = (saved: OnboardingStep): OnboardingStep => {
  if (saved === "complete") return "complete";
  if (saved === "questionnaire") return "questionnaire";
  return "upload";
};
