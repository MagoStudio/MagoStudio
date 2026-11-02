import {
  LatestSubscription,
  SubscriptionStatus,
  SubscriptionType
} from "@schemas/balance";

const getPlanTypeFromTitle = (planTitle?: string): SubscriptionType => {
  if (
    planTitle &&
    Object.values(SubscriptionType).includes(planTitle as SubscriptionType)
  ) {
    return planTitle as SubscriptionType;
  }
  return SubscriptionType.FREE;
};

export const getCurrentPlanType = (
  subscription?: LatestSubscription
): SubscriptionType => {
  if (!subscription?.id) {
    return SubscriptionType.FREE;
  }

  if (subscription?.status === SubscriptionStatus.INCOMPLETE_EXPIRED) {
    return SubscriptionType.FREE;
  }

  if (
    subscription?.status === SubscriptionStatus.PAST_DUE &&
    subscription?.current_period_end &&
    subscription.current_period_end <= Date.now() / 1000
  ) {
    return SubscriptionType.FREE;
  }

  if (subscription?.status === SubscriptionStatus.PAST_DUE) {
    return getPlanTypeFromTitle(subscription?.features?.title);
  }

  if (
    subscription?.status === SubscriptionStatus.CANCELED &&
    subscription?.current_period_end &&
    subscription.current_period_end <= Date.now() / 1000
  ) {
    return SubscriptionType.FREE;
  }

  if (
    subscription?.status === SubscriptionStatus.CANCELED &&
    subscription?.current_period_end &&
    subscription.current_period_end > Date.now() / 1000
  ) {
    return getPlanTypeFromTitle(subscription?.features?.title);
  }

  if (subscription?.status === SubscriptionStatus.ACTIVE) {
    return getPlanTypeFromTitle(subscription?.features?.title);
  }

  return SubscriptionType.FREE;
};
