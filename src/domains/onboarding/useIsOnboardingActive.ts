import { ONBOARDING_SEARCH_PARAM, ROUTES } from "@config/constants";
import { ONBOARDING_PROJECT_STEPS } from "@store/atoms/onboardingAtom";
import { usePathname, useSearchParams } from "next/navigation";

import { useIsOnboardingCompleted } from "./useIsOnboardingCompleted";
import { useOnboardingProgress } from "./useOnboardingProgress";
import { normalizeRoute } from "./utils/normalizeRoute";

export const useIsOnboardingActive = (): boolean => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [{ step, renderSubmitted }] = useOnboardingProgress();
  const isReleasedByCompletion = useIsOnboardingCompleted();

  const isPastRenderSubmission = step === "render" && Boolean(renderSubmitted);

  if (step === "complete" || step === "tutorial") return false;
  if (isReleasedByCompletion && !isPastRenderSubmission) return false;

  const path = normalizeRoute(pathname ?? "");
  const isOnboardingRoute = path === normalizeRoute(ROUTES.ONBOARDING);
  const isOnboardingProject =
    path === normalizeRoute(ROUTES.PROJECT) &&
    (searchParams.get(ONBOARDING_SEARCH_PARAM) === "1" ||
      ONBOARDING_PROJECT_STEPS.includes(step));

  return isOnboardingRoute || isOnboardingProject;
};
