import { OnboardingStep } from "@store/atoms/onboardingAtom";

interface ResolveQuestionnaireResumeStepArgs {
  step: OnboardingStep;
  questionnaireCompleted: boolean;
}

export const resolveQuestionnaireResumeStep = ({
  step,
  questionnaireCompleted
}: ResolveQuestionnaireResumeStepArgs): OnboardingStep =>
  step === "questionnaire" && questionnaireCompleted ? "upload" : step;
