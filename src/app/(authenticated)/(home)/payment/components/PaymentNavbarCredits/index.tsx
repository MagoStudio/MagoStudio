import { CircularProgress } from "@components/CircularProgress";
import { CreditCoin } from "@components/CreditCoin";
import { RelaxedUsageWheel } from "@components/RelaxedUsageWheel";
import { Text } from "@components/Text";
import { useBalance } from "@domains/payment/useBalance";
import { useCurrentSubscription } from "@domains/payment/useCurrentSubscription";
import { useIsUnlimitedModeActive } from "@domains/payment/useIsUnlimitedModeActive";
import { RelaxedModeType } from "@schemas/balance";
import { useTranslation } from "react-i18next";

import { CreditsModeMenu } from "./CreditsModeMenu";

interface Props {
  isRelaxedModeApplicable?: boolean;
}

export function PaymentNavbarCredits({
  isRelaxedModeApplicable = true
}: Props) {
  const { t } = useTranslation();
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance();
  const { relaxedModeType, relaxedUsage } = useCurrentSubscription();
  const { isUnlimitedModeActive } = useIsUnlimitedModeActive();

  if (isBalanceLoading)
    return (
      <div className="flex items-center px-3">
        <CircularProgress
          size="sm"
          aria-label={t("status.loading_credits.label")}
        />
      </div>
    );
  if (!balanceData) return null;

  const modeLabel =
    relaxedModeType === RelaxedModeType.UNLIMITED
      ? t("credits_menu.unlimited_mode.label")
      : t("credits_menu.relaxed_mode.label");

  const showsRelaxedModeInsteadOfCredits =
    isRelaxedModeApplicable && isUnlimitedModeActive;
  const showsUsageWheel =
    showsRelaxedModeInsteadOfCredits && relaxedUsage?.day_used_pct != null;

  return (
    <CreditsModeMenu isModeChoiceApplicable={isRelaxedModeApplicable}>
      {showsRelaxedModeInsteadOfCredits ? (
        <>
          <span className="inline-flex items-center">
            <CreditCoin icon="off" variant="sm" />
            <Text color="inherit" component="span" select="none" variant="sm">
              {modeLabel}
            </Text>
          </span>
          {showsUsageWheel && (
            <RelaxedUsageWheel usedPct={relaxedUsage.day_used_pct ?? 0} />
          )}
        </>
      ) : (
        <CreditCoin count={balanceData.amount || 0} variant="sm" monochrome />
      )}
    </CreditsModeMenu>
  );
}
