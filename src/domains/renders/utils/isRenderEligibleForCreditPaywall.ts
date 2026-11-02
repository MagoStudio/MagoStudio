import { isSubscriptionKnownToLackAccess } from "@domains/payment/utils/isSubscriptionKnownToLackAccess";

import { RenderProvider } from "@/platform/modelProviders";

export const isRenderEligibleForCreditPaywall = ({
  renderProvider,
  isSubscriptionLoading,
  doesSubscriptionGrantAccess
}: {
  renderProvider: RenderProvider | null;
  isSubscriptionLoading: boolean;
  doesSubscriptionGrantAccess: boolean;
}): boolean =>
  renderProvider === "mago-cloud" &&
  isSubscriptionKnownToLackAccess({
    isSubscriptionLoading,
    doesSubscriptionGrantAccess
  });
