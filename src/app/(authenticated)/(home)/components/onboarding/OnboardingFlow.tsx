/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect: routes the user based on async onboarding status + project data */
import { ONBOARDING_SEARCH_PARAM, ROUTES } from "@config/constants";
import { useIsSignupQuestionnaireCompleted } from "@domains/onboarding/useIsSignupQuestionnaireCompleted";
import { useNeedsOnboarding } from "@domains/onboarding/useNeedsOnboarding";
import { useOnboardingProgress } from "@domains/onboarding/useOnboardingProgress";
import { isOnboardingProjectName } from "@domains/onboarding/utils/onboardingProjectName";
import { resolveQuestionnaireResumeStep } from "@domains/onboarding/utils/resolveQuestionnaireResumeStep";
import { resolveResumeStep } from "@domains/onboarding/utils/resolveResumeStep";
import { useProjectList } from "@domains/project/useProjectList";
import { useOnboardingResetBaseline } from "@hooks/userLocalStorage/useOnboardingResetBaseline";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { OnboardingQuestionnaireStep } from "./OnboardingQuestionnaireStep";
import { OnboardingStepTransition } from "./OnboardingStepTransition";
import { OnboardingUploadStep } from "./OnboardingUploadStep";

export const OnboardingFlow: React.FC = () => {
  const router = useRouter();
  const [progress, setProgress] = useOnboardingProgress();
  const { needsOnboarding, isLoading: statusLoading } = useNeedsOnboarding();
  const { allItems, isLoading: projectsLoading } = useProjectList();
  const resetBaseline = useOnboardingResetBaseline();
  const questionnaireCompleted = useIsSignupQuestionnaireCompleted();

  const onboardingProject = allItems.find(
    (project) =>
      isOnboardingProjectName(project.name) &&
      !resetBaseline.includes(project.id)
  );
  const isResolving = statusLoading || projectsLoading;

  useEffect(() => {
    if (isResolving) return;

    if (needsOnboarding === false) {
      router.replace("/");
      return;
    }

    if (onboardingProject) {
      setProgress((prev) => ({
        ...prev,
        step: "generate-image"
      }));
      router.replace(
        `${ROUTES.PROJECT}?projectId=${onboardingProject.id}&${ONBOARDING_SEARCH_PARAM}=1`
      );
      return;
    }

    const resumed = resolveQuestionnaireResumeStep({
      step: resolveResumeStep(progress.step),
      questionnaireCompleted
    });
    if (resumed !== progress.step) {
      setProgress((prev) => ({ ...prev, step: resumed }));
    }
  }, [
    isResolving,
    needsOnboarding,
    onboardingProject,
    progress.step,
    questionnaireCompleted,
    router,
    setProgress
  ]);

  if (isResolving || needsOnboarding === false || onboardingProject)
    return null;

  return (
    <OnboardingStepTransition transitionKey={progress.step}>
      {progress.step === "questionnaire" ? (
        <OnboardingQuestionnaireStep />
      ) : (
        <OnboardingUploadStep />
      )}
    </OnboardingStepTransition>
  );
};
