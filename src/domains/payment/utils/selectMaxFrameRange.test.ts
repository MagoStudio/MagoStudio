import { BalanceWithComputedFields } from "@domains/payment/interface";
import { SubscriptionType } from "@schemas/balance";
import { describe, expect, it } from "vitest";

import { createBalance } from "../../../../tests/factories/balance";

import { overrideBalanceSubscription } from "./overrideBalanceSubscription";
import { selectMaxFrameRange } from "./selectMaxFrameRange";

const createComputedBalance = (): BalanceWithComputedFields => {
  const base = createBalance();
  return {
    ...base,
    latest_subscription: {
      ...base.latest_subscription,
      formattedExpirationDate: ""
    },
    currentPlanType: SubscriptionType.FREE
  };
};

describe("selectMaxFrameRange", () => {
  it("reads the plan's maximum_frame_range from the balance", () => {
    const balance = createComputedBalance();
    balance.latest_subscription.features.maximum_frame_range = 300;

    expect(selectMaxFrameRange(balance)).toBe(300);
  });

  it("returns the mocked plan's max frame range when a subscription override is applied", () => {
    const overridden = overrideBalanceSubscription(
      createComputedBalance(),
      SubscriptionType.UNLIMITED_STUDIO
    );

    expect(selectMaxFrameRange(overridden) ?? 0).toBeGreaterThan(0);
  });

  it("returns undefined when the plan has no max frame range", () => {
    const balance = createComputedBalance();
    balance.latest_subscription.features.maximum_frame_range = undefined;

    expect(selectMaxFrameRange(balance)).toBeUndefined();
  });

  it("passes a raw 0 through as 0 (the un-overridden free value that drove the crash)", () => {
    expect(selectMaxFrameRange(createComputedBalance())).toBe(0);
  });
});
