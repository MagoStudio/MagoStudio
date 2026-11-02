import { describe, expect, it } from "vitest";

import { isRenderEligibleForCreditPaywall } from "./isRenderEligibleForCreditPaywall";

const subscriptionKnownToLackAccess = {
  isSubscriptionLoading: false,
  doesSubscriptionGrantAccess: false
};

describe("isRenderEligibleForCreditPaywall", () => {
  it("is eligible for a Mago cloud render when the subscription is known to lack access", () => {
    expect(
      isRenderEligibleForCreditPaywall({
        renderProvider: "mago-cloud",
        ...subscriptionKnownToLackAccess
      })
    ).toBe(true);
  });

  it.each(["local-comfy", null] as const)(
    "is never eligible for a %s render",
    (renderProvider) => {
      expect(
        isRenderEligibleForCreditPaywall({
          renderProvider,
          ...subscriptionKnownToLackAccess
        })
      ).toBe(false);
    }
  );

  it("is not eligible while the subscription is loading", () => {
    expect(
      isRenderEligibleForCreditPaywall({
        renderProvider: "mago-cloud",
        isSubscriptionLoading: true,
        doesSubscriptionGrantAccess: false
      })
    ).toBe(false);
  });

  it("is not eligible when the subscription grants access", () => {
    expect(
      isRenderEligibleForCreditPaywall({
        renderProvider: "mago-cloud",
        isSubscriptionLoading: false,
        doesSubscriptionGrantAccess: true
      })
    ).toBe(false);
  });
});
