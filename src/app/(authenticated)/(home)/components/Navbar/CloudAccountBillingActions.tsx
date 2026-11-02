import { GhostButton } from "@components/GhostButton";
import { ROUTES } from "@config/constants";
import { usePortalSession } from "@hooks/payment/usePortalSession";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { openExternalUrl } from "@/platform/cloudAccount";

interface CloudAccountBillingActionsProps {
  onNavigateAway: () => void;
}

export const CloudAccountBillingActions: React.FC<
  CloudAccountBillingActionsProps
> = ({ onNavigateAway }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutate: openPortalSession, isPending: isPortalSessionPending } =
    usePortalSession();

  const openSubscriptionsAndCredits = () => {
    onNavigateAway();
    router.push(ROUTES.PAYMENT_MAIN_PAGE);
  };

  const openBillingInfo = () => {
    openPortalSession(undefined, {
      onSuccess: (portalUrl) => openExternalUrl(portalUrl)
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <GhostButton
        data-testid="user-menu-subscriptions-and-credits"
        onPress={openSubscriptionsAndCredits}
      >
        {t("titles.subscriptions_and_credits.label")}
      </GhostButton>
      <GhostButton
        data-testid="user-menu-billing-info"
        loading={isPortalSessionPending}
        isDisabled={isPortalSessionPending}
        onPress={openBillingInfo}
      >
        {t("titles.billing_info.label")}
      </GhostButton>
    </div>
  );
};
