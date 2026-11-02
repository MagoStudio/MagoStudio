"use client";

import { TabsMenuRounded } from "@components/TabsMenuRounded";
import { ROUTES } from "@config/constants";
import { PaymentCreditsTab } from "@home/payment/components/PaymentCreditsTab";
import { PaymentInfo } from "@home/payment/components/PaymentInfo";
import { PaymentInfoTitle } from "@home/payment/components/PaymentInfoTitle";
import { PaymentSubscriptionsTab } from "@home/payment/components/PaymentSubscriptionsTab";
import { PricingContactForm } from "@home/pricing/components/PricingContactForm";
import { PricingCustomSolution } from "@home/pricing/components/PricingCustomSolution";
import { usePrices } from "@hooks/payment/usePrices";
import { useShallowRouter } from "@hooks/useShallowRouter";
import { useSearchParams } from "next/navigation";
import { Key } from "react-aria-components/Breadcrumbs";
import { TabPanel, Tabs } from "react-aria-components/Tabs";
import { useTranslation } from "react-i18next";

export default function Payment() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const shallowRouter = useShallowRouter();
  const { data: pricesData, isLoading: arePricesLoading } = usePrices();

  const tabList = [
    { name: t("titles.subscriptions.label"), id: "subscriptions" },
    { name: t("titles.credits.label"), id: "credits" }
  ];
  const tab = searchParams.get("tab");

  const handleTabChange = (key: Key) => {
    shallowRouter.push(`${ROUTES.PAYMENT_MAIN_PAGE}?tab=${key}`);
  };

  return (
    <div className="flex flex-col flex-1 items-center m-auto px-7 py-4 bg-[url('/assets/images/background/pricing-pattern.svg')] bg-no-repeat bg-fixed min-h-screen bg-position-[calc(50%_+_var(--app-sidebar-current-width)_/_2)_0px] box-content">
      <div className="w-full">
        <div className="mb-10">
          <PaymentInfoTitle
            className="max-w-[50%]"
            title={t("titles.our_plans_and_credits.label")}
          />
        </div>
      </div>

      <Tabs
        className="w-full"
        selectedKey={tab ?? "subscriptions"}
        onSelectionChange={handleTabChange}
      >
        <section className="pb-8 relative m-auto w-full lg:max-w-[var(--breakpoint-xl)] lg:min-w-[64rem]">
          <TabsMenuRounded tabs={tabList} />
        </section>

        <TabPanel id="subscriptions">
          <section className="relative m-auto w-full lg:max-w-[var(--breakpoint-xl)] lg:min-w-[64rem]">
            <PaymentSubscriptionsTab />
          </section>
        </TabPanel>

        <TabPanel id="credits">
          <PaymentCreditsTab
            arePricesLoading={arePricesLoading}
            priceOptions={pricesData?.payment || []}
          />
        </TabPanel>
      </Tabs>

      <section className="pt-8 relative m-auto w-full lg:max-w-(--breakpoint-xl) min-w-5xl">
        <div className="grid w-full grid-cols-2">
          <PricingCustomSolution />
          <PricingContactForm />
        </div>
      </section>

      <section className="pt-8 relative m-auto w-full lg:max-w-(--breakpoint-xl) min-w-5xl">
        <PaymentInfo />
      </section>
    </div>
  );
}
