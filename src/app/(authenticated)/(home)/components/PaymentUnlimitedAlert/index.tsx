import { Alert } from "@components/Alert";
import { MainButton } from "@components/MainButton";
import { ROUTES } from "@config/constants";
import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { formatResetCountdownHours } from "@domains/payment/utils/formatResetCountdown";
import { useUnlimitedAlert } from "@hooks/userLocalStorage/useUnlimitedAlert";
import { cn } from "@utils";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";

type AlertReason = "simultaneous" | "daily" | "weekly";

interface Props {
  floatingStyles?: React.CSSProperties;
  variant?: "panel" | "img2img";
  limit?: number;
  reason?: AlertReason;
  resetAtSeconds?: number;
}

export const PaymentUnlimitedAlert = forwardRef<HTMLDivElement, Props>(
  (
    {
      floatingStyles,
      variant = "panel",
      limit = 1,
      reason = "simultaneous",
      resetAtSeconds
    },
    ref
  ) => {
    const { t } = useTranslation();
    const { setUnlimitedAlertDismissedTime } = useUnlimitedAlert();
    const { setIsUnlimitedModeActive } = useIsUnlimitedModeActive();

    const handleUnlimitedAlertDismiss = () => {
      setUnlimitedAlertDismissedTime(Date.now());
    };

    const isRateLimit = reason === "daily" || reason === "weekly";
    const resetHours =
      resetAtSeconds !== undefined
        ? formatResetCountdownHours(resetAtSeconds)
        : 0;

    const messageText =
      reason === "daily"
        ? t("notifications.payment_flow_daily_limit_reached.description", {
            count: resetHours
          })
        : reason === "weekly"
          ? t("notifications.payment_flow_weekly_limit_reached.description", {
              count: resetHours
            })
          : variant === "img2img"
            ? t(
                "notifications.payment_flow_relaxed_mode_render_limit_image.description",
                { count: limit }
              )
            : t(
                "notifications.payment_flow_relaxed_mode_render_limit_video.description",
                { count: limit }
              );

    return (
      <div className="w-full" ref={ref} style={floatingStyles}>
        <div
          className={cn(variant === "panel" && "-translate-y-full p-3 pb-1")}
        >
          <Alert
            color={isRateLimit ? "element-error" : "surface-bg-100"}
            onClose={handleUnlimitedAlertDismiss}
            actions={
              <div className="flex gap-2">
                <MainButton
                  variant="outlined"
                  colorScheme="onColor"
                  onPress={() => setIsUnlimitedModeActive(false)}
                >
                  {t("actions.payment_flow_switch_to_credits.label")}
                </MainButton>
                {isRateLimit && (
                  <MainButton
                    variant="outlined"
                    colorScheme="onColor"
                    href={ROUTES.PAYMENT_CREDITS}
                  >
                    {t("notifications.payment_flow_enough_coins.buy_credits")}
                  </MainButton>
                )}
              </div>
            }
          >
            {messageText}
          </Alert>
        </div>
      </div>
    );
  }
);

PaymentUnlimitedAlert.displayName = "PaymentUnlimitedAlert";
