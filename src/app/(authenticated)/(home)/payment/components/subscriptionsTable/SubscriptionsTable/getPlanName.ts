import { SubscriptionType } from "@schemas/balance";
import { TFunction } from "i18next";

export const getPlanName = (
  planType: SubscriptionType | undefined,
  t: TFunction
): string => {
  if (!planType) return "";

  const planMap: Record<SubscriptionType, string> = {
    [SubscriptionType.UNLIMITED_PRO_ANNUAL]: t("titles.pro_plan.label"),
    [SubscriptionType.UNLIMITED_PRO]: t("titles.pro_plan.label"),
    [SubscriptionType.UNLIMITED_STUDIO]: t("titles.studio_plan.label"),
    [SubscriptionType.UNLIMITED_STUDIO_ANNUAL]: t("titles.studio_plan.label"),
    [SubscriptionType.UNLIMITED_BASIC]: t("titles.beginner_plan.label"),
    [SubscriptionType.FREE]: t("titles.free_plan.label")
  };

  return planMap[planType] || "";
};
