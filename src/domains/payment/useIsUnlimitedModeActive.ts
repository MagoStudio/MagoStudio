import { useBalance } from "@domains/payment/useBalance";
import { useUserLocalStorage } from "@hooks/userLocalStorage";
import { Balance, SubscriptionStatus } from "@schemas/balance";

const checkHasActiveSubscription = (balanceData: Balance) => {
  if (!balanceData?.latest_subscription?.id) return false;
  const subscription = balanceData.latest_subscription;
  const currentPeriodEnd = subscription.current_period_end ?? 0;
  const hasExpired = currentPeriodEnd <= Date.now() / 1000;

  const isActiveOrPastDue =
    subscription.status === SubscriptionStatus.ACTIVE ||
    subscription.status === SubscriptionStatus.PAST_DUE;

  const hasRelaxedMode = subscription.features?.relaxed_mode_type != null;

  return isActiveOrPastDue && !hasExpired && hasRelaxedMode;
};

const computeIsUnlimited = (
  hasActiveSubscription: boolean,
  storedUnlimitedMode: boolean | undefined
) => {
  if (!hasActiveSubscription) {
    return false;
  }

  if (!storedUnlimitedMode) {
    return false;
  }

  return true;
};

export const useIsUnlimitedModeActive = () => {
  const { data: balanceData } = useBalance();
  const [storedUnlimitedMode, setIsUnlimitedModeActive] =
    useUserLocalStorage<boolean>("isUnlimitedModeEnabled", false);
  const hasActiveSubscription = balanceData
    ? checkHasActiveSubscription(balanceData)
    : false;
  const isUnlimitedModeActive = computeIsUnlimited(
    hasActiveSubscription,
    storedUnlimitedMode
  );
  return {
    isUnlimitedModeActive,
    setIsUnlimitedModeActive
  };
};
