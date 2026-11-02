import { BalanceWithComputedFields } from "@domains/payment/interface";
import {
  RelaxedModeType,
  SubscriptionStatus,
  SubscriptionType
} from "@schemas/balance";

const STABLE_FUTURE_PERIOD_END_SECONDS = 4102444800;

interface PlanFeatures {
  annual: boolean;
  relaxed_mode_type: RelaxedModeType | null;
  simultaneous_image_renders: number;
  simultaneous_video_renders: number;
  maximum_frame_range: number;
}

const PLAN_FEATURES: Record<SubscriptionType, PlanFeatures> = {
  [SubscriptionType.FREE]: {
    annual: false,
    relaxed_mode_type: null,
    simultaneous_image_renders: 0,
    simultaneous_video_renders: 0,
    maximum_frame_range: 0
  },
  [SubscriptionType.UNLIMITED_BASIC]: {
    annual: false,
    relaxed_mode_type: null,
    simultaneous_image_renders: 1,
    simultaneous_video_renders: 1,
    maximum_frame_range: 100
  },
  [SubscriptionType.UNLIMITED_PRO]: {
    annual: false,
    relaxed_mode_type: RelaxedModeType.RELAXED,
    simultaneous_image_renders: 2,
    simultaneous_video_renders: 2,
    maximum_frame_range: 300
  },
  [SubscriptionType.UNLIMITED_PRO_ANNUAL]: {
    annual: true,
    relaxed_mode_type: RelaxedModeType.RELAXED,
    simultaneous_image_renders: 2,
    simultaneous_video_renders: 2,
    maximum_frame_range: 300
  },
  [SubscriptionType.UNLIMITED_STUDIO]: {
    annual: false,
    relaxed_mode_type: RelaxedModeType.UNLIMITED,
    simultaneous_image_renders: 2,
    simultaneous_video_renders: 2,
    maximum_frame_range: 300
  },
  [SubscriptionType.UNLIMITED_STUDIO_ANNUAL]: {
    annual: true,
    relaxed_mode_type: RelaxedModeType.UNLIMITED,
    simultaneous_image_renders: 2,
    simultaneous_video_renders: 2,
    maximum_frame_range: 300
  }
};

export const overrideBalanceSubscription = (
  balance: BalanceWithComputedFields,
  override: SubscriptionType
): BalanceWithComputedFields => {
  const hasSubscription = override !== SubscriptionType.FREE;
  const planFeatures = PLAN_FEATURES[override];

  const overriddenSubscriptionFields = hasSubscription
    ? {
        id: balance.latest_subscription?.id ?? "dev-override-subscription",
        status: SubscriptionStatus.ACTIVE,
        current_period_end: STABLE_FUTURE_PERIOD_END_SECONDS,
        cancel_at_period_end: false
      }
    : {
        status: SubscriptionStatus.INCOMPLETE_EXPIRED,
        current_period_end: 0,
        cancel_at_period_end: false
      };

  return {
    ...balance,
    currentPlanType: override,
    latest_subscription: {
      ...balance.latest_subscription,
      ...overriddenSubscriptionFields,
      features: {
        ...balance.latest_subscription.features,
        ...planFeatures
      }
    }
  };
};
