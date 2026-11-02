import { BalanceWithComputedFields } from "@domains/payment/interface";
import { useBalance } from "@domains/payment/useBalance";
import { SubscriptionType } from "@schemas/balance";

const selectCurrentPlanType = (
  data: BalanceWithComputedFields
): SubscriptionType => data.currentPlanType;

export function useCurrentPlanType() {
  return useBalance(selectCurrentPlanType);
}
