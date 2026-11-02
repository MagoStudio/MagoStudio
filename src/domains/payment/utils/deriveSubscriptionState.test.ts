import { BalanceWithComputedFields } from "@domains/payment/interface";
import { SubscriptionStatus, SubscriptionType } from "@schemas/balance";
import { describe, expect, it } from "vitest";

import { deriveSubscriptionState } from "./deriveSubscriptionState";

const NOW_IN_SECONDS = 1_700_000_000;
const FUTURE_PERIOD_END_SECONDS = NOW_IN_SECONDS + 1000;
const PAST_PERIOD_END_SECONDS = NOW_IN_SECONDS - 1000;

const buildBalance = (
  overrides: {
    currentPlanType?: SubscriptionType;
    targetPriceId?: string;
    targetStartDate?: number;
    formattedExpirationDate?: string;
    subscription?: {
      id?: string;
      status?: SubscriptionStatus | null;
      current_period_end?: number;
      cancel_at_period_end?: boolean;
    };
  } = {}
): BalanceWithComputedFields =>
  ({
    currentPlanType: overrides.currentPlanType ?? SubscriptionType.FREE,
    latest_subscription: {
      id: overrides.subscription?.id,
      status: overrides.subscription?.status ?? null,
      current_period_end: overrides.subscription?.current_period_end ?? 0,
      cancel_at_period_end:
        overrides.subscription?.cancel_at_period_end ?? false,
      features: { annual: false },
      schedule: {
        target_price_id: overrides.targetPriceId,
        target_start_date: overrides.targetStartDate
      },
      formattedExpirationDate: overrides.formattedExpirationDate ?? ""
    }
  }) as unknown as BalanceWithComputedFields;

const deriveAtFixedTime = (balance: BalanceWithComputedFields) =>
  deriveSubscriptionState(balance, NOW_IN_SECONDS);

describe("deriveSubscriptionState", () => {
  it.each([
    [SubscriptionType.FREE, { isFreeSubscription: true }],
    [SubscriptionType.UNLIMITED_BASIC, { isBasicSubscription: true }],
    [SubscriptionType.UNLIMITED_PRO, { isProSubscription: true }],
    [SubscriptionType.UNLIMITED_PRO_ANNUAL, { isProSubscription: true }],
    [SubscriptionType.UNLIMITED_STUDIO, { isStudioSubscription: true }],
    [SubscriptionType.UNLIMITED_STUDIO_ANNUAL, { isStudioSubscription: true }]
  ])("classifies %s correctly", (type, expected) => {
    const result = deriveAtFixedTime(buildBalance({ currentPlanType: type }));
    expect(result).toMatchObject(expected);
    expect(result.subscriptionType).toBe(type);
  });

  it("marks isScheduledToFree when no target price id is set", () => {
    const result = deriveAtFixedTime(buildBalance());
    expect(result.isScheduledToFree).toBe(true);
  });

  it("clears isScheduledToFree when a target price id is set", () => {
    const result = deriveAtFixedTime(
      buildBalance({ targetPriceId: "price_123" })
    );
    expect(result.isScheduledToFree).toBe(false);
    expect(result.targetPriceId).toBe("price_123");
  });

  it("allows downgrade when active pro user has no scheduled downgrade", () => {
    const result = deriveAtFixedTime(
      buildBalance({
        currentPlanType: SubscriptionType.UNLIMITED_PRO,
        subscription: {
          id: "sub_1",
          status: SubscriptionStatus.ACTIVE,
          current_period_end: FUTURE_PERIOD_END_SECONDS,
          cancel_at_period_end: false
        }
      })
    );
    expect(result.canDowngradeToFree).toBe(true);
  });

  it("disables downgrade when subscription is not active", () => {
    const result = deriveAtFixedTime(
      buildBalance({ currentPlanType: SubscriptionType.UNLIMITED_PRO })
    );
    expect(result.canDowngradeToFree).toBe(false);
  });

  it("passes the formatted expiration date through", () => {
    const result = deriveAtFixedTime(
      buildBalance({ formattedExpirationDate: "2026-12-31" })
    );
    expect(result.subscriptionExpirationDate).toBe("2026-12-31");
  });

  it("returns the scheduled start date when present", () => {
    const result = deriveAtFixedTime(
      buildBalance({ targetStartDate: 1234567890 })
    );
    expect(result.scheduledStartDate).toBe(1234567890);
  });

  describe("doesSubscriptionGrantAccess", () => {
    it("grants access for an active subscription", () => {
      const result = deriveAtFixedTime(
        buildBalance({
          subscription: {
            id: "sub_1",
            status: SubscriptionStatus.ACTIVE,
            current_period_end: FUTURE_PERIOD_END_SECONDS,
            cancel_at_period_end: false
          }
        })
      );
      expect(result.doesSubscriptionGrantAccess).toBe(true);
    });

    it("grants access for a will-cancel subscription still inside its paid period", () => {
      const result = deriveAtFixedTime(
        buildBalance({
          subscription: {
            id: "sub_1",
            status: SubscriptionStatus.ACTIVE,
            current_period_end: FUTURE_PERIOD_END_SECONDS,
            cancel_at_period_end: true
          }
        })
      );
      expect(result.doesSubscriptionGrantAccess).toBe(true);
    });

    it("grants access for a past-due subscription that has not expired", () => {
      const result = deriveAtFixedTime(
        buildBalance({
          subscription: {
            id: "sub_1",
            status: SubscriptionStatus.PAST_DUE,
            current_period_end: FUTURE_PERIOD_END_SECONDS
          }
        })
      );
      expect(result.doesSubscriptionGrantAccess).toBe(true);
    });

    it("denies access once the subscription has expired, regardless of status", () => {
      const result = deriveAtFixedTime(
        buildBalance({
          subscription: {
            id: "sub_1",
            status: SubscriptionStatus.ACTIVE,
            current_period_end: PAST_PERIOD_END_SECONDS,
            cancel_at_period_end: false
          }
        })
      );
      expect(result.doesSubscriptionGrantAccess).toBe(false);
    });

    it("denies access when there is no subscription at all", () => {
      const result = deriveAtFixedTime(buildBalance());
      expect(result.doesSubscriptionGrantAccess).toBe(false);
    });

    it("grants access for a cancelled subscription still inside its paid period", () => {
      const result = deriveAtFixedTime(
        buildBalance({
          subscription: {
            id: "sub_1",
            status: SubscriptionStatus.CANCELED,
            current_period_end: FUTURE_PERIOD_END_SECONDS
          }
        })
      );
      expect(result.doesSubscriptionGrantAccess).toBe(true);
    });

    it("denies access for a cancelled subscription past its period end", () => {
      const result = deriveAtFixedTime(
        buildBalance({
          subscription: {
            id: "sub_1",
            status: SubscriptionStatus.CANCELED,
            current_period_end: PAST_PERIOD_END_SECONDS
          }
        })
      );
      expect(result.doesSubscriptionGrantAccess).toBe(false);
    });

    it("denies access for an Incomplete Expired subscription", () => {
      const result = deriveAtFixedTime(
        buildBalance({
          subscription: {
            id: "sub_1",
            status: SubscriptionStatus.INCOMPLETE_EXPIRED,
            current_period_end: FUTURE_PERIOD_END_SECONDS
          }
        })
      );
      expect(result.doesSubscriptionGrantAccess).toBe(false);
    });
  });
});
