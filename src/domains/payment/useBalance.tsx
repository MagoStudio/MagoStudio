import { useFetchBalance } from "@domains/payment/data/useFetchBalance";
import { overrideBalanceSubscription } from "@domains/payment/utils/overrideBalanceSubscription";
import { overrideRelaxedUsage } from "@domains/payment/utils/overrideRelaxedUsage";
import { formatSubscriptionDate } from "@home/payment/components/helpers/formatSubscriptionDate";
import { getCurrentPlanType } from "@home/payment/components/helpers/getCurrentPlanType";
import { useSubscriptionOverride } from "@hooks/useSubscriptionOverride";
import { Balance } from "@schemas/balance";

import { BalanceWithComputedFields } from "./interface";

export function useBalance<T = BalanceWithComputedFields>(
  customSelect?: (data: BalanceWithComputedFields) => T
) {
  const {
    subscriptionOverride,
    relaxedDayUsedPctOverride,
    relaxedDayResetAtOverride,
    relaxedWeekUsedPctOverride,
    relaxedWeekResetAtOverride
  } = useSubscriptionOverride();

  const select = (data: Balance): T => {
    const subscription = data.latest_subscription;
    const currentPlanType = getCurrentPlanType(subscription);

    const baseResult: BalanceWithComputedFields = {
      ...data,
      latest_subscription: {
        ...subscription,
        formattedExpirationDate: subscription.current_period_end
          ? formatSubscriptionDate(subscription.current_period_end)
          : ""
      },
      currentPlanType
    };

    const overriddenBalance = subscriptionOverride
      ? overrideBalanceSubscription(baseResult, subscriptionOverride)
      : baseResult;
    const effectiveResult = overrideRelaxedUsage(overriddenBalance, {
      dayUsedPct: relaxedDayUsedPctOverride,
      dayResetAt: relaxedDayResetAtOverride,
      weekUsedPct: relaxedWeekUsedPctOverride,
      weekResetAt: relaxedWeekResetAtOverride
    });

    return customSelect
      ? customSelect(effectiveResult)
      : (effectiveResult as unknown as T);
  };
  return useFetchBalance(select);
}
