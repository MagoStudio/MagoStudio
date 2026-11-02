import {
  MILLISECONDS_TO_SECONDS,
  MINUTES_TO_SECONDS,
  STALE_TIME_MINUTES
} from "@domains/payment/constants";
import {
  LatestSubscription,
  SubscriptionStatus,
  SubscriptionType
} from "@schemas/balance";
import { PaymentType, PriceOption } from "@schemas/price";
import { useQuery } from "@tanstack/react-query";

import { backendApiClient } from "@/lib/backend-api-client";
import { isCloudAccountActive } from "@/platform/cloudAccount";
import { queryKeys } from "@/queryKeys";

export interface PricesResponse {
  payment: PriceOption[];
  subscription: PriceOption[];
}

async function fetchPrices(): Promise<PricesResponse> {
  const response = await backendApiClient.get<PricesResponse>("/prices");
  return response.data;
}

const isSubscriptionOngoing = (subscription: LatestSubscription): boolean => {
  const { status, current_period_end } = subscription;
  if (!status || !subscription.id) return false;

  if (status === SubscriptionStatus.ACTIVE) return true;

  const periodStillActive = current_period_end > Date.now() / 1000;

  if (status === SubscriptionStatus.CANCELED && periodStillActive) return true;
  if (status === SubscriptionStatus.PAST_DUE && periodStillActive) return true;

  return false;
};

export function enrichWithLegacyPlan(
  pricesData: PricesResponse,
  subscription: LatestSubscription | undefined,
  subscriptionTypeOverride?: SubscriptionType
): PricesResponse {
  if (!subscription) return pricesData;

  const isLegacyPlan =
    subscription.features?.archived === true &&
    isSubscriptionOngoing(subscription);

  const planTitle = isLegacyPlan
    ? subscription.features?.title
    : subscriptionTypeOverride;

  if (!planTitle || planTitle === SubscriptionType.FREE) return pricesData;

  const planExistsInApi = pricesData.subscription.some(
    (option) => option.features?.title === planTitle
  );

  if (planExistsInApi) return pricesData;

  const syntheticPlan: PriceOption = {
    id: subscription.price_id ?? "",
    payment_type: PaymentType.SUBSCRIPTION,
    price: isLegacyPlan ? subscription.price_amount : 0,
    currency: subscription.price_currency || "eur",
    credits: 0,
    discount: 0,
    features: isLegacyPlan
      ? { ...subscription.features, title: planTitle, hidden: false }
      : {
          title: planTitle,
          annual:
            planTitle === SubscriptionType.UNLIMITED_PRO_ANNUAL ||
            planTitle === SubscriptionType.UNLIMITED_STUDIO_ANNUAL
        }
  };

  return {
    ...pricesData,
    subscription: [...pricesData.subscription, syntheticPlan]
  };
}

export function usePrices() {
  return useQuery({
    queryKey: queryKeys.prices.all,
    queryFn: () => fetchPrices(),
    enabled: isCloudAccountActive(),
    staleTime: MILLISECONDS_TO_SECONDS * MINUTES_TO_SECONDS * STALE_TIME_MINUTES
  });
}
