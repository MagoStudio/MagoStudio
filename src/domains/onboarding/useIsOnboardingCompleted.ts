import { featureFlags } from "@config/featureFlags";
import { useFetchBalance } from "@domains/payment/useFetchBalance";
import { useForceOnboardingComplete } from "@hooks/userLocalStorage/useForceOnboardingComplete";
import { useForceOnboardingEnabled } from "@hooks/userLocalStorage/useForceOnboardingEnabled";
import { useMockOnboardingIncomplete } from "@hooks/userLocalStorage/useMockOnboardingIncomplete";

import { isOnboardingCompleted } from "./utils/isOnboardingCompleted";

export const useIsOnboardingCompleted = (): boolean => {
  const mockIncomplete = useMockOnboardingIncomplete();
  const forceComplete = useForceOnboardingComplete();
  const forceOnboardingEnabled = useForceOnboardingEnabled();
  const { data } = useFetchBalance((balance) =>
    isOnboardingCompleted(balance.onboarding)
  );

  if (mockIncomplete) return false;

  const isOnboardingEnabledForUser =
    featureFlags.IS_ONBOARDING_ENABLED || forceOnboardingEnabled;

  if (!isOnboardingEnabledForUser) return true;
  if (forceComplete) return true;

  return data ?? false;
};
