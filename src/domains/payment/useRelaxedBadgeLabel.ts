import { useCurrentSubscription } from "@domains/payment/useCurrentSubscription";
import { getRelaxedBadgeLabelKey } from "@domains/payment/utils/getRelaxedBadgeLabelKey";
import { useTranslation } from "react-i18next";

export const useRelaxedBadgeLabel = (): string | undefined => {
  const { t } = useTranslation();
  const { relaxedModeType } = useCurrentSubscription();
  const labelKey = getRelaxedBadgeLabelKey(relaxedModeType);
  return labelKey ? t(labelKey) : undefined;
};
