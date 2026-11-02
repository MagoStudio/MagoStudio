import { LatestSubscription, SubscriptionType } from "@schemas/balance";
import { PriceOption } from "@schemas/price";
import type { TFunction } from "i18next";

import { formatSubscriptionDate } from "../../helpers/formatSubscriptionDate";

import { getPlanNameById } from "./getPlanNameById";

interface GetExpirationLabelParams {
  currentSubscription?: LatestSubscription;
  isSubscriptionIncompleteExpired?: boolean;
  isSubscriptionCancelled?: boolean;
  isSubscriptionExpired?: boolean;
  isSubscriptionPastDue?: boolean;
  availableSubscriptions?: PriceOption[];
  t: TFunction;
  planType?: SubscriptionType;
  subscriptionType?: SubscriptionType;
}

export const getSubscriptionExpirationLabel = ({
  currentSubscription,
  isSubscriptionIncompleteExpired,
  isSubscriptionCancelled,
  isSubscriptionExpired,
  isSubscriptionPastDue,
  availableSubscriptions,
  t,
  planType,
  subscriptionType
}: GetExpirationLabelParams): string | undefined => {
  if (!currentSubscription) return undefined;

  if (planType && subscriptionType) {
    const isCurrentPlan = subscriptionType === planType;
    const isLastSubscribedPlan =
      currentSubscription?.features?.title === planType;
    if (!isCurrentPlan && !isLastSubscribedPlan) {
      return undefined;
    }
  }

  if (!currentSubscription?.current_period_end) return undefined;

  if (isSubscriptionIncompleteExpired) return undefined;

  const formattedDate = formatSubscriptionDate(
    currentSubscription.current_period_end
  );

  const subscriptionCancelAtPeriodEnd =
    currentSubscription?.cancel_at_period_end;

  const willExpire =
    subscriptionCancelAtPeriodEnd ||
    (isSubscriptionCancelled && !isSubscriptionExpired) ||
    (isSubscriptionPastDue && !isSubscriptionExpired);

  if (willExpire) {
    return `${t("titles.expires.label")} ${formattedDate}`;
  }

  if (
    currentSubscription?.schedule?.target_price_id &&
    currentSubscription?.schedule?.target_start_date
  ) {
    const changeDate = formatSubscriptionDate(
      currentSubscription.schedule.target_start_date
    );
    const targetPlanName = getPlanNameById(
      currentSubscription.schedule.target_price_id,
      availableSubscriptions,
      t
    );
    return t("titles.changes_after.label", {
      date: changeDate,
      plan: targetPlanName
    });
  }

  return undefined;
};
