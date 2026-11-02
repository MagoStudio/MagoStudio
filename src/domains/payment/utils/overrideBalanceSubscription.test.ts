import { BalanceWithComputedFields } from "@domains/payment/interface";
import {
  RelaxedModeType,
  SubscriptionStatus,
  SubscriptionType
} from "@schemas/balance";
import { describe, expect, it } from "vitest";

import { deriveSubscriptionState } from "./deriveSubscriptionState";
import { overrideBalanceSubscription } from "./overrideBalanceSubscription";

const NOW_IN_SECONDS = 1_700_000_000;

const baseBalance = {
  currentPlanType: SubscriptionType.FREE,
  latest_subscription: {
    features: { annual: false },
    schedule: {},
    formattedExpirationDate: ""
  }
} as unknown as BalanceWithComputedFields;

const realActiveSubscriberBalance = {
  currentPlanType: SubscriptionType.UNLIMITED_PRO,
  latest_subscription: {
    id: "real-active-subscription",
    status: SubscriptionStatus.ACTIVE,
    current_period_end: NOW_IN_SECONDS + 100_000,
    cancel_at_period_end: false,
    features: { annual: false },
    schedule: {},
    formattedExpirationDate: ""
  }
} as unknown as BalanceWithComputedFields;

describe("overrideBalanceSubscription", () => {
  it("sets the overridden plan type", () => {
    const result = overrideBalanceSubscription(
      baseBalance,
      SubscriptionType.UNLIMITED_PRO
    );
    expect(result.currentPlanType).toBe(SubscriptionType.UNLIMITED_PRO);
  });

  it("marks the subscription as active for any non-free override", () => {
    const result = overrideBalanceSubscription(
      baseBalance,
      SubscriptionType.UNLIMITED_PRO
    );
    const derived = deriveSubscriptionState(result, NOW_IN_SECONDS);
    expect(derived).toMatchObject({
      hasSubscription: true,
      canCancelSubscription: true,
      isSubscriptionActiveWithoutCancellation: true,
      isSubscriptionActiveButWillCancel: false,
      isSubscriptionCancelled: false,
      isSubscriptionExpired: false,
      isSubscriptionPastDue: false
    });
  });

  it("clears subscription presence when overriding to free", () => {
    const result = overrideBalanceSubscription(
      baseBalance,
      SubscriptionType.FREE
    );
    const derived = deriveSubscriptionState(result, NOW_IN_SECONDS);
    expect(derived).toMatchObject({
      hasSubscription: false,
      canCancelSubscription: false,
      isSubscriptionActiveWithoutCancellation: false
    });
  });

  it("grants no access on a FREE override", () => {
    const result = overrideBalanceSubscription(
      baseBalance,
      SubscriptionType.FREE
    );
    const derived = deriveSubscriptionState(result, NOW_IN_SECONDS);
    expect(derived.hasSubscription).toBe(false);
    expect(derived.doesSubscriptionGrantAccess).toBe(false);
  });

  it("grants no access when a real Active subscriber is overridden to FREE", () => {
    const result = overrideBalanceSubscription(
      realActiveSubscriberBalance,
      SubscriptionType.FREE
    );
    const derived = deriveSubscriptionState(result, NOW_IN_SECONDS);
    expect(derived.hasSubscription).toBe(false);
    expect(derived.doesSubscriptionGrantAccess).toBe(false);
  });

  it.each([
    [SubscriptionType.UNLIMITED_PRO_ANNUAL, true],
    [SubscriptionType.UNLIMITED_STUDIO_ANNUAL, true],
    [SubscriptionType.UNLIMITED_PRO, false],
    [SubscriptionType.UNLIMITED_STUDIO, false],
    [SubscriptionType.UNLIMITED_BASIC, false],
    [SubscriptionType.FREE, false]
  ])("flags %s as annual=%s", (type, expected) => {
    const result = overrideBalanceSubscription(baseBalance, type);
    const derived = deriveSubscriptionState(result, NOW_IN_SECONDS);
    expect(derived.isSubscriptionAnnual).toBe(expected);
  });

  it.each([
    [SubscriptionType.UNLIMITED_STUDIO, RelaxedModeType.UNLIMITED],
    [SubscriptionType.UNLIMITED_STUDIO_ANNUAL, RelaxedModeType.UNLIMITED],
    [SubscriptionType.UNLIMITED_PRO, RelaxedModeType.RELAXED],
    [SubscriptionType.UNLIMITED_PRO_ANNUAL, RelaxedModeType.RELAXED],
    [SubscriptionType.UNLIMITED_BASIC, null],
    [SubscriptionType.FREE, null]
  ])("maps %s to relaxed_mode_type=%s", (type, expected) => {
    const result = overrideBalanceSubscription(baseBalance, type);
    expect(result.latest_subscription.features.relaxed_mode_type).toBe(
      expected
    );
  });

  it("activates the raw subscription fields for a non-free override", () => {
    const result = overrideBalanceSubscription(
      baseBalance,
      SubscriptionType.UNLIMITED_STUDIO
    );
    expect(result.latest_subscription.status).toBe("active");
    expect(result.latest_subscription.id).toBeTruthy();
    expect(result.latest_subscription.current_period_end).toBeGreaterThan(
      Date.now() / 1000
    );
  });

  it.each([
    SubscriptionType.UNLIMITED_PRO,
    SubscriptionType.UNLIMITED_PRO_ANNUAL,
    SubscriptionType.UNLIMITED_STUDIO,
    SubscriptionType.UNLIMITED_STUDIO_ANNUAL
  ])(
    "gives %s a non-zero maximum_frame_range so relaxed mode has a valid range",
    (type) => {
      const result = overrideBalanceSubscription(baseBalance, type);
      expect(
        result.latest_subscription.features.maximum_frame_range ?? 0
      ).toBeGreaterThan(0);
    }
  );

  it("uses a stable current_period_end across calls (no Date.now volatility)", () => {
    const first = overrideBalanceSubscription(
      baseBalance,
      SubscriptionType.UNLIMITED_PRO
    );
    const second = overrideBalanceSubscription(
      baseBalance,
      SubscriptionType.UNLIMITED_PRO
    );
    expect(first.latest_subscription.current_period_end).toBe(
      second.latest_subscription.current_period_end
    );
  });
});
