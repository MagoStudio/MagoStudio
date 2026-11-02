import { MainButton } from "@components/MainButton";
import { ROUTES } from "@config/constants";
import { useCurrentSubscription } from "@domains/payment/useCurrentSubscription";
import { useCreateCheckoutSession } from "@hooks/payment/useCreateCheckoutSession";
import { usePortalSession } from "@hooks/payment/usePortalSession";
import { useUpgradeSubscription } from "@hooks/payment/useUpgradeSubscription";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useShallowRouter } from "@hooks/useShallowRouter";
import { SubscriptionType } from "@schemas/balance";
import { PriceOption } from "@schemas/price";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { openExternalUrl } from "@/platform/cloudAccount";

import { getPlanTierLevel } from "../../helpers/getPlanTierLevel";
import { handlePastDuePayment } from "../../helpers/handlePastDue";

interface Props {
  loading?: boolean;
  onDowngradeClick?: (targetPriceId: string) => void;
  cardPlan: PriceOption;
  isCurrentPlan?: boolean;
}

export const PaymentSubscriptionButtons: React.FC<Props> = ({
  loading = false,
  onDowngradeClick,
  cardPlan,
  isCurrentPlan: isCurrentPlanProp
}) => {
  const { t } = useTranslation();
  const {
    subscription,
    subscriptionType,
    targetPriceId,
    hasSubscription,
    isSubscriptionActiveWithoutCancellation,
    isSubscriptionActiveButWillCancel,
    isSubscriptionPastDue,
    isSubscriptionCancelled,
    isSubscriptionExpired,
    isStudioSubscription
  } = useCurrentSubscription();

  const { mutate: createPortalSession } = usePortalSession();
  const {
    mutate: createCheckoutSession,
    isPending: subscriptionCheckoutLoading
  } = useCreateCheckoutSession();
  const shallowRouter = useShallowRouter();
  const router = useRouter();

  const noActiveSubscription = !hasSubscription || isSubscriptionExpired;

  const targetPlanType = cardPlan.features?.title;
  const isCurrentPlan =
    isCurrentPlanProp ?? subscriptionType === targetPlanType;
  const isCurrentPlanAnnual = Boolean(cardPlan.features?.annual);

  const isCurrentPlanActive =
    isCurrentPlan && isSubscriptionActiveWithoutCancellation;

  const isPastDue = isCurrentPlan && isSubscriptionPastDue;

  const isCanceledOrWillCancel =
    isCurrentPlan &&
    !isSubscriptionPastDue &&
    (isSubscriptionCancelled || isSubscriptionActiveButWillCancel);

  const canDowngrade =
    isSubscriptionActiveWithoutCancellation &&
    subscriptionType &&
    onDowngradeClick &&
    (subscriptionType === SubscriptionType.UNLIMITED_PRO_ANNUAL ||
      isStudioSubscription ||
      (subscriptionType === SubscriptionType.UNLIMITED_PRO &&
        targetPlanType === SubscriptionType.UNLIMITED_BASIC));

  const isTargetPlanHigherOrSameTier =
    getPlanTierLevel(targetPlanType) >= getPlanTierLevel(subscriptionType);

  const { handleUpgrade } = useUpgradeSubscription(subscription, cardPlan);

  const isScheduledPlan = targetPriceId === cardPlan.id;

  const hasScheduledDowngrade =
    isCurrentPlan &&
    isSubscriptionActiveWithoutCancellation &&
    targetPriceId &&
    targetPriceId !== cardPlan.id;

  const handleDowngrade = () => {
    onDowngradeClick?.(cardPlan.id);
  };

  const handleOpenPortalSession = () => {
    trackingUtils.paymentActions[
      isSubscriptionPastDue
        ? "paymentSubscriptionUpdateCard"
        : "paymentSubscriptionRenew"
    ](subscription?.id || undefined);
    handlePastDuePayment({
      createPortalSession,
      // A Stripe URL: the real browser, not this window.
      onRedirect: (url) => openExternalUrl(url),
      onError: (error) => {
        console.error("Failed to open billing portal:", error);
      }
    });
  };

  const handleSubscriptionCheckout = () => {
    if (cardPlan.features?.title) {
      const mode = isCurrentPlanAnnual ? "yearly" : "monthly";
      trackingUtils.paymentActions.buyPlanClick(cardPlan.features.title, mode);
    }
    createCheckoutSession({ priceId: cardPlan.id });
  };

  const handleTopUpCredits = () => {
    shallowRouter.push(ROUTES.PAYMENT_CREDITS);
  };

  if (isScheduledPlan) {
    return (
      <MainButton variant="outlined" colorScheme="onColor" isDisabled fullWidth>
        {t("titles.scheduled_from.label")}
      </MainButton>
    );
  }

  if (isCanceledOrWillCancel && !cardPlan.features?.archived) {
    return (
      <MainButton fullWidth onPress={handleOpenPortalSession}>
        {t("actions.renew_plan.label")}
      </MainButton>
    );
  }

  if (noActiveSubscription) {
    return (
      <MainButton
        fullWidth
        loading={subscriptionCheckoutLoading}
        onPress={handleSubscriptionCheckout}
      >
        {t("actions.upgrade.label")}
      </MainButton>
    );
  }

  if (hasScheduledDowngrade && !cardPlan.features?.archived) {
    return (
      <MainButton
        fullWidth
        loading={subscriptionCheckoutLoading}
        onPress={handleOpenPortalSession}
      >
        {t("actions.renew_plan.label")}
      </MainButton>
    );
  }

  if (isCurrentPlanActive) {
    return (
      <MainButton fullWidth onPress={handleTopUpCredits}>
        {t("actions.top_up_credits.label")}
      </MainButton>
    );
  }

  if (isPastDue) {
    return (
      <MainButton fullWidth onPress={handleOpenPortalSession}>
        {t("actions.update_card_info.label")}
      </MainButton>
    );
  }

  if (canDowngrade) {
    return (
      <MainButton
        variant="outlined"
        colorScheme="onColor"
        fullWidth
        loading={loading}
        onPress={handleDowngrade}
      >
        {t("actions.downgrade.label")}
      </MainButton>
    );
  }

  if (!isCurrentPlan && isTargetPlanHigherOrSameTier) {
    const useExistingSubscription = Boolean(subscription?.id);

    return (
      <MainButton
        fullWidth
        loading={!useExistingSubscription ? subscriptionCheckoutLoading : false}
        onPress={
          useExistingSubscription ? handleUpgrade : handleSubscriptionCheckout
        }
      >
        {t("actions.upgrade.label")}
      </MainButton>
    );
  }

  return null;
};
