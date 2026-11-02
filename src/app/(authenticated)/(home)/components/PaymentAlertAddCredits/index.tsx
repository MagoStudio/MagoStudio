import { Alert } from "@components/Alert";
import { MainButton } from "@components/MainButton";
import { ROUTES } from "@config/constants";
import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { useCreditsAlert } from "@hooks/userLocalStorage/useCreditsAlert";
import { cn } from "@utils";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  floatingStyles?: React.CSSProperties;
  variant?: "panel" | "img2img";
  isUnlimitedAvailable?: boolean;
}

export const PaymentAlertAddCredits = forwardRef<HTMLDivElement, Props>(
  ({ floatingStyles, variant = "panel", isUnlimitedAvailable }, ref) => {
    const { t } = useTranslation();
    const { setCreditsAlertDismissedTime } = useCreditsAlert();
    const { setIsUnlimitedModeActive } = useIsUnlimitedModeActive();

    const handleEnableUnlimited = () => {
      setIsUnlimitedModeActive(true);
    };

    const handleAddCreditsAlertDismiss = () => {
      setCreditsAlertDismissedTime(Date.now());
    };

    const handleAddCreditsClick = () => {
      trackingUtils.paymentActions.addCreditsButtonClicked();
    };

    return (
      <div className="w-full" ref={ref} style={floatingStyles}>
        <div
          className={cn(
            "w-full",
            variant === "panel" && "p-3 pb-1 -translate-y-full"
          )}
        >
          <Alert
            color="surface-bg-100"
            onClose={handleAddCreditsAlertDismiss}
            actions={
              <div className="flex gap-2">
                <MainButton
                  variant="outlined"
                  colorScheme="onColor"
                  href={ROUTES.PAYMENT_CREDITS}
                  onPress={handleAddCreditsClick}
                >
                  {t("notifications.payment_flow_enough_coins.buy_credits")}
                </MainButton>

                {isUnlimitedAvailable ? (
                  <MainButton
                    variant="outlined"
                    colorScheme="onColor"
                    onPress={handleEnableUnlimited}
                  >
                    {t(
                      "notifications.payment_flow_enough_coins.enable_relaxed"
                    )}
                  </MainButton>
                ) : (
                  <MainButton
                    variant="outlined"
                    colorScheme="onColor"
                    href={ROUTES.PAYMENT_SUBSCRIPTIONS}
                  >
                    {t("notifications.payment_flow_enough_coins.try_relaxed")}
                  </MainButton>
                )}
              </div>
            }
          >
            {t("notifications.payment_flow_enough_coins.description")}
          </Alert>
        </div>
      </div>
    );
  }
);

PaymentAlertAddCredits.displayName = "PaymentAlertAddCredits";
