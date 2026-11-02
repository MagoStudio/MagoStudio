import { TabsMenuRounded } from "@components/TabsMenuRounded";
import { ROUTES } from "@config/constants";
import { PaymentModal } from "@home/payment/components/PaymentModal";
import { usePrices } from "@hooks/payment/usePrices";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useMountEffect } from "@hooks/useMountEffect";
import { SubscriptionType } from "@schemas/balance";
import { useLatestProjectIdAtom } from "@store/atoms";
import { useAtomValue } from "jotai";
import { useState, useRef } from "react";
import type { Key } from "react-aria-components/Breadcrumbs";
import { Tabs } from "react-aria-components/Tabs";
import { useTranslation } from "react-i18next";

import { SubscriptionsTableFooter } from "../SubscriptionsTableFooter";

import { SubscriptionsTableBody } from "./SubscriptionsTableBody";

export const SubscriptionsTable: React.FC = () => {
  const { t } = useTranslation();
  const { data: pricesData } = usePrices();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<Key>("yearly");
  const latestProjectId = useAtomValue(useLatestProjectIdAtom());

  const successRedirectPath = latestProjectId
    ? `${ROUTES.PROJECT}?projectId=${latestProjectId}`
    : "/";

  const paymentModalContent = {
    description: t(
      "notifications.your_subscription_is_working_now.description"
    ),
    redirectText: t(
      "notifications.payment_flow_success_redirection.description"
    ),
    redirectPath: successRedirectPath
  };

  const annualPlan =
    pricesData?.subscription?.find(
      (subscription) =>
        subscription.features?.title === SubscriptionType.UNLIMITED_PRO_ANNUAL
    ) ??
    pricesData?.subscription?.find(
      (subscription) =>
        subscription.features?.title ===
        SubscriptionType.UNLIMITED_STUDIO_ANNUAL
    );

  const hasCheckedStripeRedirect = useRef(false);
  useMountEffect(() => {
    if (hasCheckedStripeRedirect.current) return;
    hasCheckedStripeRedirect.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const fromTab = urlParams.get("tab");

    if (fromTab !== "subscriptions") return;

    if (success === "true") {
      trackingUtils.paymentActions.paymentSuccess({
        source: "payment_page",
        status: "success"
      });

      setIsPaymentModalOpen(true);
    }
  });

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };

  const annualDiscount = annualPlan?.discount || 0;

  const tabList = [
    {
      name: t("payment.yearly_discount", { annualDiscount }),
      showGradient: true,
      gifSrc: "/money-wings.gif",
      id: "yearly"
    },
    { name: t("payment.monthly"), id: "monthly" }
  ];

  return (
    <>
      <div className="flex flex-col items-center justify-center pt-8 pb-14 px-8 w-full gap-10 rounded-3xl bg-card-gradient shadow-payment-card backdrop-blur-md">
        <Tabs
          className="flex justify-center"
          selectedKey={selectedTab}
          onSelectionChange={setSelectedTab}
        >
          <TabsMenuRounded tabs={tabList} />
        </Tabs>
        <SubscriptionsTableBody isYearly={selectedTab === "yearly"} />
        <SubscriptionsTableFooter />
      </div>
      <PaymentModal
        description={paymentModalContent.description}
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        redirectPath={paymentModalContent.redirectPath}
        redirectText={paymentModalContent.redirectText}
      />
    </>
  );
};
