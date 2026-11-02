import { SubscriptionType } from "@schemas/balance";
import { PriceOption } from "@schemas/price";
import type { TFunction } from "i18next";

const getPlanTranslationKey = (planType: SubscriptionType): string => {
  switch (planType) {
    case SubscriptionType.UNLIMITED_BASIC:
      return "titles.beginner_plan.label";
    case SubscriptionType.UNLIMITED_PRO:
      return "titles.pro_plan.label";
    case SubscriptionType.UNLIMITED_STUDIO:
    case SubscriptionType.UNLIMITED_STUDIO_ANNUAL:
      return "titles.studio_plan.label";
    case SubscriptionType.FREE:
    default:
      return "titles.free_plan.label";
  }
};

export const getPlanNameById = (
  priceId: string | null | undefined,
  availableSubscriptions: PriceOption[] | undefined,
  t: TFunction
): string => {
  if (!priceId || !availableSubscriptions) {
    return t(getPlanTranslationKey(SubscriptionType.FREE));
  }

  const targetSubscription = availableSubscriptions.find(
    (subscription: PriceOption) => subscription.id === priceId
  );

  const planType = targetSubscription?.features?.title || SubscriptionType.FREE;
  return t(getPlanTranslationKey(planType));
};
