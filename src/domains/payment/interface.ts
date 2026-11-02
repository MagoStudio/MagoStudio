import {
  LatestSubscription,
  SubscriptionType,
  Balance
} from "@schemas/balance";

export interface BalanceWithComputedFields extends Balance {
  latest_subscription: LatestSubscription & {
    formattedExpirationDate: string;
  };
  currentPlanType: SubscriptionType;
}
