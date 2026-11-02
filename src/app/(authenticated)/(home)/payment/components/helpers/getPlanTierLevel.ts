import { SubscriptionType } from "@schemas/balance";

const PLAN_TIER_LEVELS: Record<SubscriptionType, number> = {
  [SubscriptionType.FREE]: 0,
  [SubscriptionType.UNLIMITED_BASIC]: 1,
  [SubscriptionType.UNLIMITED_PRO]: 2,
  [SubscriptionType.UNLIMITED_PRO_ANNUAL]: 2,
  [SubscriptionType.UNLIMITED_STUDIO]: 3,
  [SubscriptionType.UNLIMITED_STUDIO_ANNUAL]: 3
};

export const getPlanTierLevel = (planType: string | undefined): number => {
  if (!planType) return 0;
  return PLAN_TIER_LEVELS[planType as SubscriptionType] ?? 0;
};
