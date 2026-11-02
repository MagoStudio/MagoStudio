import { BulkRenderingNavButton } from "@components/BulkRenderingPanel/BulkRenderingNavButton";
import { MainButton } from "@components/MainButton";
import { SidebarLink } from "@components/SidebarLink";
import { ROUTES } from "@config/constants";
import { useBulkRendersRunsAcrossProjects } from "@domains/bulkRendersRun/useBulkRendersRuns";
import { countBulkRendersRunsByActivity } from "@domains/bulkRendersRun/utils/countBulkRendersRunsByActivity";
import { useBalance } from "@domains/payment/useBalance";
import { useCurrentSubscription } from "@domains/payment/useCurrentSubscription";
import { getNavbarSubscriptionEntry } from "@domains/payment/utils/getNavbarSubscriptionEntry";
import { PlansNavButton } from "@home/components/Navbar/PlansNavButton";
import { QueueStatusTabButton } from "@home/components/Navbar/QueueStatusTabButton";
import { UserMenu } from "@home/components/Navbar/UserMenu";
import { PaymentNavbarCredits } from "@home/payment/components/PaymentNavbarCredits";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useIsTeamMember } from "@hooks/userLocalStorage/useIsTeamMember";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

type Props = {
  isPlansDrawerOpen: boolean;
  isQueueDrawerOpen: boolean;
  isBulkRenderingPanelOpen: boolean;
  onTogglePlansDrawer: () => void;
  onToggleQueueDrawer: () => void;
  onToggleBulkRenderingPanel: () => void;
};

export const SidebarGlobalEntries: React.FC<Props> = ({
  isPlansDrawerOpen,
  isQueueDrawerOpen,
  isBulkRenderingPanelOpen,
  onTogglePlansDrawer,
  onToggleQueueDrawer,
  onToggleBulkRenderingPanel
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const isTeamMember = useIsTeamMember();

  const { data: bulkRendersRuns } =
    useBulkRendersRunsAcrossProjects(isTeamMember);
  const bulkRenderingActivityCounts = countBulkRendersRunsByActivity(
    bulkRendersRuns ?? []
  );

  const { data: balanceData } = useBalance();
  const userCreditsCount = balanceData?.amount ?? 0;
  const { doesSubscriptionGrantAccess, isLoading: isSubscriptionLoading } =
    useCurrentSubscription();
  const navbarSubscriptionEntry = getNavbarSubscriptionEntry({
    isSubscriptionLoading,
    doesSubscriptionGrantAccess
  });

  const isScriptProjectPage = pathname.startsWith(ROUTES.SCRIPT_PROJECT);
  const isRelaxedModeApplicable = !isScriptProjectPage;
  const isPaymentPage = pathname.startsWith(ROUTES.PAYMENT_MAIN_PAGE);

  return (
    <div className="flex flex-col gap-1 px-3 pb-3">
      {isTeamMember && (
        <PlansNavButton
          isSelected={isPlansDrawerOpen}
          onClick={onTogglePlansDrawer}
        />
      )}
      {isTeamMember && (
        <BulkRenderingNavButton
          isSelected={isBulkRenderingPanelOpen}
          onClick={onToggleBulkRenderingPanel}
          activityCounts={bulkRenderingActivityCounts}
        />
      )}
      <PaymentNavbarCredits isRelaxedModeApplicable={isRelaxedModeApplicable} />
      <QueueStatusTabButton
        isSelected={isQueueDrawerOpen}
        onClick={onToggleQueueDrawer}
      />
      {navbarSubscriptionEntry === "subscribe" && (
        <MainButton
          colorScheme="gradient"
          fullWidth
          data-testid="header-pricing-button"
          aria-label={t("new_users_paywall.navbar_subscribe.label")}
          onPress={() => {
            trackingUtils.paymentActions.navbarBalanceClick(userCreditsCount);
            router.push(ROUTES.PAYMENT_SUBSCRIPTIONS);
          }}
        >
          {t("new_users_paywall.navbar_subscribe.label")}
        </MainButton>
      )}
      {navbarSubscriptionEntry === "pricing-link" && (
        <SidebarLink
          href={ROUTES.PAYMENT_SUBSCRIPTIONS}
          isCurrentPage={isPaymentPage}
          data-testid="header-pricing-button"
          onClick={() =>
            trackingUtils.paymentActions.navbarBalanceClick(userCreditsCount)
          }
        >
          {t("titles.pricing.sales_label")}
        </SidebarLink>
      )}
      <UserMenu />
    </div>
  );
};
