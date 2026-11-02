/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { ROUTES } from "@config/constants";
import { formatPrice } from "@home/payment/components/helpers/formatPrice";
import { getCheckoutOutcome } from "@home/payment/components/helpers/getCheckoutOutcome";
import { getCreditDescriptions } from "@home/payment/components/helpers/getCreditDescriptions";
import { getCurrencySymbol } from "@home/payment/components/helpers/getCurrencySymbol";
import { getPackDiscountSubtitle } from "@home/payment/components/helpers/getPackDiscountSubtitle";
import { PaymentCardHeader } from "@home/payment/components/PaymentCardHeader";
import { PaymentInfoCard } from "@home/payment/components/PaymentInfoCard";
import { PaymentLoader } from "@home/payment/components/PaymentLoader";
import { PaymentModal } from "@home/payment/components/PaymentModal";
import { PaymentPriceColumn } from "@home/payment/components/PaymentPriceColumn";
import { PaymentTabSection } from "@home/payment/components/PaymentTabSection";
import { useCreateCheckoutSession } from "@hooks/payment/useCreateCheckoutSession";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { PriceOption } from "@schemas/price";
import { useLatestProjectIdAtom } from "@store/atoms";
import { formatCreditCount } from "@utils/formatCreditCount";
import { useAtomValue } from "jotai";
import { useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  priceOptions: PriceOption[];
  arePricesLoading: boolean;
}

export const PaymentCreditsTab: React.FC<Props> = ({
  priceOptions,
  arePricesLoading
}) => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const latestProjectId = useAtomValue(useLatestProjectIdAtom());
  const {
    mutate: createCheckoutSession,
    isPending: isCheckoutLoading,
    isError: isCheckoutError,
    reset: resetCheckoutSession
  } = useCreateCheckoutSession();
  const creditDescriptions = getCreditDescriptions(t);

  const [dismissedPaymentModalKey, setDismissedPaymentModalKey] = useState<
    string | null
  >(null);

  const checkoutOutcome = getCheckoutOutcome(searchParams);

  const successRedirectPath = latestProjectId
    ? `${ROUTES.PROJECT}?projectId=${latestProjectId}`
    : "/";

  const activePaymentModal = isCheckoutError
    ? {
        key: "checkout-error",
        description: t(
          "notifications.payment_flow_checkout_session_error.description"
        ),
        redirectText: "",
        redirectPath: ROUTES.PAYMENT_CREDITS
      }
    : checkoutOutcome === "success"
      ? {
          key: "success",
          description: t("notifications.payment_flow_success.description"),
          redirectText: t(
            "notifications.payment_flow_success_redirection.description"
          ),
          redirectPath: successRedirectPath
        }
      : checkoutOutcome === "canceled"
        ? {
            key: "canceled",
            description: t("notifications.payment_flow_canceled.description"),
            redirectText: t(
              "notifications.payment_flow_canceled_redirection.description"
            ),
            redirectPath: ROUTES.PAYMENT_CREDITS
          }
        : null;

  const isPaymentModalOpen =
    activePaymentModal !== null &&
    dismissedPaymentModalKey !== activePaymentModal.key;

  useEffect(() => {
    if (checkoutOutcome === "success") {
      trackingUtils.paymentActions.paymentSuccess({
        source: "payment_page",
        status: "success"
      });
      return;
    }
    if (checkoutOutcome === "canceled") {
      resetCheckoutSession?.();
    }
  }, [checkoutOutcome, resetCheckoutSession]);

  const handleClosePaymentModal = useCallback(() => {
    setDismissedPaymentModalKey(activePaymentModal?.key ?? null);
  }, [activePaymentModal?.key]);

  const handleCheckout = useCallback(
    async (optionId?: string) => {
      const idToUse = optionId;
      const option = priceOptions.find((opt) => opt.id === idToUse);
      if (!option) return;

      createCheckoutSession({ priceId: option.id });
    },
    [priceOptions, createCheckoutSession]
  );

  const handleBuyButtonClick = useCallback(
    (optionId: string) => {
      const option = priceOptions.find((opt) => opt.id === optionId);
      if (!option) return;
      trackingUtils.paymentActions.buyPlanClick(
        option.credits.toString() as "10000" | "30000" | "90000"
      );
      void handleCheckout(optionId);
    },
    [priceOptions, handleCheckout]
  );

  if (arePricesLoading) {
    return (
      <PaymentTabSection>
        <PaymentLoader />
      </PaymentTabSection>
    );
  }

  const sortedPriceOptions = priceOptions.sort((a, b) => a.price - b.price);
  const bestOffer = sortedPriceOptions[sortedPriceOptions.length - 1];

  return (
    <>
      <PaymentTabSection>
        {sortedPriceOptions.map((option) => {
          const isOptionLoading = isCheckoutLoading || arePricesLoading;
          const currencySymbol = getCurrencySymbol(option.currency);
          return (
            <div key={option.id} className="h-full">
              <PaymentInfoCard
                id={option.id}
                disabled={isOptionLoading}
                isBestOffer={option.id === bestOffer.id}
                footer={
                  <MainButton
                    loading={isOptionLoading}
                    onPress={() => handleBuyButtonClick(option.id)}
                  >
                    {t("actions.payment_flow_buy_this.label")}
                  </MainButton>
                }
              >
                <div className="flex justify-between gap-3">
                  <PaymentCardHeader
                    subtitle={getPackDiscountSubtitle(option.credits, t)}
                    title={formatCreditCount(Math.floor(option.credits))}
                    kicker={t("titles.credits.label")}
                  />
                  <PaymentPriceColumn
                    price={`${currencySymbol} ${formatPrice(option.price)}`}
                  />
                </div>
                <ul className="mb-2">
                  {creditDescriptions[option.credits]?.content.map(
                    (text, index) => (
                      <li key={index}>
                        <Text color="glyph-primary" select="none" variant="sm">
                          {text}
                        </Text>
                      </li>
                    )
                  )}
                </ul>
              </PaymentInfoCard>
            </div>
          );
        })}
      </PaymentTabSection>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        description={activePaymentModal?.description ?? ""}
        redirectText={activePaymentModal?.redirectText ?? ""}
        redirectPath={
          activePaymentModal?.redirectPath ?? ROUTES.PAYMENT_CREDITS
        }
      />
    </>
  );
};
