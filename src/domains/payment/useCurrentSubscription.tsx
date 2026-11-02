import { currentTimeStore } from "@domains/payment/currentTimeStore";
import { BalanceWithComputedFields } from "@domains/payment/interface";
import { useBalance } from "@domains/payment/useBalance";
import { deriveSubscriptionState } from "@domains/payment/utils/deriveSubscriptionState";
import {
  RelaxedModeType,
  RelaxedUsage,
  SubscriptionType
} from "@schemas/balance";
import { useSyncExternalStore } from "react";

interface CurrentSubscriptionData {
  canCancelSubscription: boolean;
  canDowngradeToFree: boolean;
  hasSubscription: boolean;
  isBasicSubscription: boolean;
  isFreeSubscription: boolean;
  isProSubscription: boolean;
  isStudioSubscription: boolean;
  isSubscriptionActiveButWillCancel: boolean;
  isSubscriptionActiveWithoutCancellation: boolean;
  isSubscriptionCancelled: boolean;
  isSubscriptionExpired: boolean;
  isSubscriptionIncompleteExpired: boolean;
  isSubscriptionPastDue: boolean;
  isSubscriptionAnnual?: boolean;
  doesSubscriptionGrantAccess: boolean;
  subscription: BalanceWithComputedFields["latest_subscription"] | undefined;
  isScheduledToFree: boolean;
  scheduledStartDate: number | null;
  subscriptionExpirationDate: string;
  relaxedModeType: RelaxedModeType | null;
  relaxedAllowedModels: string[];
  relaxedUsage: RelaxedUsage | null;
  isModeToggleAvailable: boolean;
  subscriptionType: SubscriptionType | undefined;
  targetPriceId: string | undefined;
}

const NOT_YET_LOADED_SUBSCRIPTION_DATA: CurrentSubscriptionData = {
  canCancelSubscription: false,
  canDowngradeToFree: false,
  hasSubscription: false,
  isBasicSubscription: false,
  isFreeSubscription: false,
  isProSubscription: false,
  isStudioSubscription: false,
  isSubscriptionActiveButWillCancel: false,
  isSubscriptionActiveWithoutCancellation: false,
  isSubscriptionCancelled: false,
  isSubscriptionExpired: false,
  isSubscriptionIncompleteExpired: false,
  isSubscriptionPastDue: false,
  isSubscriptionAnnual: false,
  doesSubscriptionGrantAccess: false,
  subscription: undefined,
  isScheduledToFree: false,
  scheduledStartDate: null,
  subscriptionExpirationDate: "",
  relaxedModeType: null,
  relaxedAllowedModels: [],
  relaxedUsage: null,
  isModeToggleAvailable: false,
  subscriptionType: undefined,
  targetPriceId: undefined
};

type UseCurrentSubscriptionReturn = {
  isLoading: boolean;
  error: Error | null;
} & CurrentSubscriptionData;

export const useCurrentSubscription = (): UseCurrentSubscriptionReturn => {
  const { data, isLoading, error } = useBalance();

  const nowInSeconds = useSyncExternalStore(
    currentTimeStore.subscribe,
    currentTimeStore.getSnapshot,
    currentTimeStore.getServerSnapshot
  );
  const derived = data
    ? deriveSubscriptionState(data, nowInSeconds)
    : NOT_YET_LOADED_SUBSCRIPTION_DATA;

  return {
    isLoading,
    error: (error as Error | null) ?? null,
    ...derived
  };
};
