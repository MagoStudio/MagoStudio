/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect: syncs the lost in-memory step from server-derived state, and navigates away from /onboarding once the exit-bounce decision resolves (a render-time redirect() races the exit-bounce decision) */
import { ONBOARDING_SEARCH_PARAM, ROUTES } from "@config/constants";
import { useNeedsOnboarding } from "@domains/onboarding/useNeedsOnboarding";
import { useOnboardingProgress } from "@domains/onboarding/useOnboardingProgress";
import { buildClearedOnboardingUrl } from "@domains/onboarding/utils/buildClearedOnboardingUrl";
import { isReloadedOnboardingLanding } from "@domains/onboarding/utils/isReloadedOnboardingLanding";
import { normalizeRoute } from "@domains/onboarding/utils/normalizeRoute";
import { resolveOnboardingGuardAction } from "@domains/onboarding/utils/resolveOnboardingGuardAction";
import { ONBOARDING_PROJECT_STEPS } from "@store/atoms/onboardingAtom";
import {
  redirect,
  usePathname,
  useRouter,
  useSearchParams
} from "next/navigation";
import { useEffect } from "react";

export const OnboardingRedirectGuard = (): null => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [{ step }, setProgress] = useOnboardingProgress();

  const path = normalizeRoute(pathname ?? "");
  const isOnboardingRoute = path === normalizeRoute(ROUTES.ONBOARDING);
  const isOnboardingProjectPath =
    path === normalizeRoute(ROUTES.PROJECT) &&
    searchParams.get(ONBOARDING_SEARCH_PARAM) === "1";
  const stepIsProjectStep = ONBOARDING_PROJECT_STEPS.includes(step);
  const justCompleted = step === "complete";
  const hasProjectId = Boolean(searchParams.get("projectId"));

  const isInOnboarding = isOnboardingRoute || isOnboardingProjectPath;
  const isReloadedOnboardingProjectPath = isReloadedOnboardingLanding({
    isOnboardingProjectPath,
    step
  });

  const canRedirect = !isInOnboarding && !justCompleted;
  const { needsOnboarding } = useNeedsOnboarding(
    canRedirect || isReloadedOnboardingProjectPath || isOnboardingRoute
  );

  const action = resolveOnboardingGuardAction({
    isOnboardingRoute,
    isOnboardingProjectPath,
    stepIsProjectStep,
    justCompleted,
    hasProjectId,
    needsOnboarding
  });

  useEffect(() => {
    if (action !== "resume-in-place") return;
    setProgress((prev) => ({ ...prev, step: "generate-image" }));
  }, [action, setProgress]);

  useEffect(() => {
    if (action !== "exit-onboarding") return;
    router.replace("/");
  }, [action, router]);

  if (action === "enter-onboarding") {
    redirect(ROUTES.ONBOARDING);
  }

  if (action === "clear-onboarding-param") {
    redirect(
      buildClearedOnboardingUrl(pathname, searchParams?.toString() ?? "")
    );
  }

  return null;
};
