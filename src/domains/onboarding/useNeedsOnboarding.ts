import { featureFlags } from "@config/featureFlags";
import { useFetchBalance } from "@domains/payment/useFetchBalance";
import { useQueue } from "@hooks/queue/useQueue";
import { useForceOnboardingComplete } from "@hooks/userLocalStorage/useForceOnboardingComplete";
import { useForceOnboardingEnabled } from "@hooks/userLocalStorage/useForceOnboardingEnabled";
import { useMockOnboardingIncomplete } from "@hooks/userLocalStorage/useMockOnboardingIncomplete";
import { useOnboardingResetBaseline } from "@hooks/userLocalStorage/useOnboardingResetBaseline";

import { hasOnboardingRenderInQueue } from "./utils/hasOnboardingRenderInQueue";
import { needsOnboardingFromBalance } from "./utils/needsOnboardingFromBalance";
import { withMockedFreshOnboarding } from "./utils/withMockedFreshOnboarding";

interface NeedsOnboardingState {
  needsOnboarding: boolean | undefined;
  isLoading: boolean;
}

export const useNeedsOnboarding = (enabled = true): NeedsOnboardingState => {
  const mockIncomplete = useMockOnboardingIncomplete();
  const forceComplete = useForceOnboardingComplete();
  const forceOnboardingEnabled = useForceOnboardingEnabled();
  const resetBaseline = useOnboardingResetBaseline();
  const {
    data: balance,
    isLoading,
    isError
  } = useFetchBalance(undefined, { enabled });

  const effectiveBalance =
    balance && mockIncomplete ? withMockedFreshOnboarding(balance) : balance;
  const balanceSaysNeeds = effectiveBalance
    ? needsOnboardingFromBalance(effectiveBalance)
    : undefined;

  const isOnboardingSkippedForUser =
    !featureFlags.IS_ONBOARDING_ENABLED &&
    !forceOnboardingEnabled &&
    !mockIncomplete;

  const {
    data: queueItems,
    isLoading: queueIsLoading,
    isError: queueIsError
  } = useQueue({
    enabled: enabled && !isOnboardingSkippedForUser && balanceSaysNeeds === true
  });

  if (enabled && (forceComplete || isOnboardingSkippedForUser)) {
    return { needsOnboarding: false, isLoading: false };
  }

  if (!enabled || isLoading || isError || !effectiveBalance) {
    return { needsOnboarding: undefined, isLoading };
  }

  if (balanceSaysNeeds === false) {
    return { needsOnboarding: false, isLoading: false };
  }

  if (queueIsError) {
    return { needsOnboarding: true, isLoading: false };
  }

  if (queueIsLoading || !queueItems) {
    return { needsOnboarding: undefined, isLoading: queueIsLoading };
  }

  return {
    needsOnboarding: !hasOnboardingRenderInQueue(queueItems, resetBaseline),
    isLoading: false
  };
};
