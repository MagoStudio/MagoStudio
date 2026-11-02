import { SubscriptionType } from "@schemas/balance";
import { TFunction } from "i18next";

export const getDowngradeButtonText = (
  targetPlan: SubscriptionType | undefined,
  t: TFunction
): string => {
  if (!targetPlan) {
    return t("actions.confirm");
  }
  const buttonTextMap: Record<SubscriptionType, string> = {
    [SubscriptionType.UNLIMITED_BASIC]: t("actions.switch_to_beginner.label"),
    [SubscriptionType.FREE]: t("actions.switch_to_free.label"),
    [SubscriptionType.UNLIMITED_PRO]: t("actions.confirm"),
    [SubscriptionType.UNLIMITED_PRO_ANNUAL]: t("actions.confirm"),
    [SubscriptionType.UNLIMITED_STUDIO]: t("actions.confirm"),
    [SubscriptionType.UNLIMITED_STUDIO_ANNUAL]: t("actions.confirm")
  };

  return buttonTextMap[targetPlan] || t("actions.confirm");
};
