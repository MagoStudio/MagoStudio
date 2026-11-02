import { relaxedLimitStore } from "@domains/payment/relaxedLimitStore";
import { useCurrentSubscription } from "@domains/payment/useCurrentSubscription";
import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { useOpenNewUsersPaywall } from "@domains/payment/useOpenNewUsersPaywall";
import { isSubscriptionKnownToLackAccess } from "@domains/payment/utils/isSubscriptionKnownToLackAccess";
import {
  parseRenderSubmitError,
  RenderSubmitErrorKind
} from "@domains/renders/api/parseRenderSubmitError";
import { useToast } from "@store/useToast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { queryKeys } from "@/queryKeys";

export function useHandleRenderSubmitError(options?: {
  showRefusalToast?: (message: string) => void;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const showRefusalToast =
    options?.showRefusalToast ?? ((message: string) => showToast({ message }));
  const { setIsUnlimitedModeActive } = useIsUnlimitedModeActive();
  const {
    relaxedUsage,
    doesSubscriptionGrantAccess,
    isLoading: isSubscriptionLoading
  } = useCurrentSubscription();
  const openNewUsersPaywall = useOpenNewUsersPaywall();
  const queryClient = useQueryClient();

  return (error: unknown): boolean => {
    const { kind, message } = parseRenderSubmitError(error);

    switch (kind) {
      case RenderSubmitErrorKind.ModeNotAvailable:
        setIsUnlimitedModeActive(false);
        showRefusalToast(
          t("notifications.payment_flow_unlimited_not_available.description")
        );
        return true;

      case RenderSubmitErrorKind.SubscriptionNotActive:
        showRefusalToast(
          t("notifications.payment_flow_subscription_not_active.description")
        );
        return true;

      case RenderSubmitErrorKind.DailyLimit:
        relaxedLimitStore.markHit("daily", relaxedUsage?.day_reset_at);
        void queryClient.invalidateQueries({ queryKey: queryKeys.balance.all });
        return true;

      case RenderSubmitErrorKind.WeeklyLimit:
        relaxedLimitStore.markHit("weekly", relaxedUsage?.week_reset_at);
        void queryClient.invalidateQueries({ queryKey: queryKeys.balance.all });
        return true;

      case RenderSubmitErrorKind.InsufficientBalance:
        void queryClient.invalidateQueries({ queryKey: queryKeys.balance.all });
        if (
          isSubscriptionKnownToLackAccess({
            isSubscriptionLoading,
            doesSubscriptionGrantAccess
          })
        ) {
          openNewUsersPaywall();
          return true;
        }
        showRefusalToast(
          message ?? t("notifications.payment_flow_enough_coins.description")
        );
        return true;

      case RenderSubmitErrorKind.MaxRenderCount:
        showRefusalToast(
          message ?? t("notifications.render_generation_failed.description")
        );
        return true;

      default:
        return false;
    }
  };
}
