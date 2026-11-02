import { BalanceWithComputedFields } from "@domains/payment/interface";
import {
  RelaxedModeType,
  RelaxedUsage,
  SubscriptionStatus,
  SubscriptionType
} from "@schemas/balance";
import { isEmpty, isNil } from "lodash";

export interface SubscriptionStateDerivation {
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
  isSubscriptionAnnual: boolean;
  doesSubscriptionGrantAccess: boolean;
  subscription: BalanceWithComputedFields["latest_subscription"];
  isScheduledToFree: boolean;
  scheduledStartDate: number | null;
  subscriptionExpirationDate: string;
  relaxedModeType: RelaxedModeType | null;
  relaxedAllowedModels: string[];
  relaxedUsage: RelaxedUsage | null;
  isModeToggleAvailable: boolean;
  subscriptionType: SubscriptionType;
  targetPriceId: string | undefined;
}

export const deriveSubscriptionState = (
  balance: BalanceWithComputedFields,
  nowInSeconds: number
): SubscriptionStateDerivation => {
  const subscription = balance.latest_subscription;
  const subscriptionType = balance.currentPlanType;

  const isBasicSubscription =
    subscriptionType === SubscriptionType.UNLIMITED_BASIC;
  const isFreeSubscription = subscriptionType === SubscriptionType.FREE;
  const isProSubscription = [
    SubscriptionType.UNLIMITED_PRO,
    SubscriptionType.UNLIMITED_PRO_ANNUAL
  ].includes(subscriptionType);
  const isStudioSubscription = [
    SubscriptionType.UNLIMITED_STUDIO,
    SubscriptionType.UNLIMITED_STUDIO_ANNUAL
  ].includes(subscriptionType);

  const isSubscriptionExpired = subscription?.current_period_end
    ? subscription.current_period_end <= nowInSeconds
    : false;

  const isSubscriptionIncompleteExpired =
    subscription?.status === SubscriptionStatus.INCOMPLETE_EXPIRED;

  const hasSubscription =
    !!subscription?.id && !isSubscriptionIncompleteExpired;

  const isSubscriptionActive =
    subscription?.status === SubscriptionStatus.ACTIVE;

  const isSubscriptionCancelled =
    subscription?.status === SubscriptionStatus.CANCELED;

  const isSubscriptionPastDue =
    subscription?.status === SubscriptionStatus.PAST_DUE;

  const isSubscriptionActiveButWillCancel =
    isSubscriptionActive &&
    !!subscription?.cancel_at_period_end &&
    !!subscription?.current_period_end &&
    subscription.current_period_end > nowInSeconds;

  const isSubscriptionActiveWithoutCancellation =
    isSubscriptionActive && !subscription?.cancel_at_period_end;

  const canCancelSubscription = isSubscriptionActiveWithoutCancellation;

  const isSubscriptionAnnual = subscription?.features?.annual ?? false;

  const targetPriceId = subscription?.schedule?.target_price_id;
  const isScheduledToFree = isNil(targetPriceId) || isEmpty(targetPriceId);
  const hasScheduledDowngradeToOtherPlan = !isScheduledToFree;

  const canDowngradeToFree = Boolean(
    isSubscriptionActiveWithoutCancellation &&
    (isProSubscription ||
      isStudioSubscription ||
      isBasicSubscription ||
      hasScheduledDowngradeToOtherPlan)
  );

  const scheduledStartDate = subscription?.schedule?.target_start_date ?? null;
  const subscriptionExpirationDate =
    subscription?.formattedExpirationDate ?? "";

  const doesSubscriptionGrantAccess =
    (isSubscriptionActiveWithoutCancellation ||
      isSubscriptionActiveButWillCancel ||
      isSubscriptionCancelled ||
      isSubscriptionPastDue) &&
    !isSubscriptionExpired;

  const relaxedModeType = subscription?.features?.relaxed_mode_type ?? null;
  const relaxedAllowedModels =
    subscription?.features?.relaxed_allowed_models ?? [];
  const relaxedUsage = balance.relaxed_usage ?? null;
  const isModeToggleAvailable =
    doesSubscriptionGrantAccess && relaxedModeType !== null;

  return {
    canCancelSubscription,
    canDowngradeToFree,
    hasSubscription,
    isBasicSubscription,
    isFreeSubscription,
    isProSubscription,
    isStudioSubscription,
    isSubscriptionActiveButWillCancel,
    isSubscriptionActiveWithoutCancellation,
    isSubscriptionCancelled,
    isSubscriptionExpired,
    isSubscriptionIncompleteExpired,
    isSubscriptionPastDue,
    subscription,
    isScheduledToFree,
    scheduledStartDate,
    subscriptionExpirationDate,
    relaxedModeType,
    relaxedAllowedModels,
    relaxedUsage,
    isModeToggleAvailable,
    isSubscriptionAnnual,
    doesSubscriptionGrantAccess,
    subscriptionType,
    targetPriceId
  };
};
