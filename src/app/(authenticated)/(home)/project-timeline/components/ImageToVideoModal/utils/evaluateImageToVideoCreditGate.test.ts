import { describe, expect, it } from "vitest";

import { evaluateImageToVideoCreditGate } from "./evaluateImageToVideoCreditGate";

const subscriberShortOfCredits = {
  renderProvider: "mago-cloud" as const,
  isCreditBalanceKnown: true,
  isOnboardingActive: false,
  isUnlimitedModeActive: false,
  userCredits: 100,
  requiredCredits: 3085,
  isSubscriptionLoading: false,
  doesSubscriptionGrantAccess: true
};

const unblocked = {
  isRenderBlockedByInsufficientCredits: false,
  isRenderBlockedByCreditPaywall: false
};

describe("evaluateImageToVideoCreditGate", () => {
  it("blocks a Mago cloud render the subscriber cannot afford", () => {
    expect(evaluateImageToVideoCreditGate(subscriberShortOfCredits)).toEqual({
      isRenderBlockedByInsufficientCredits: true,
      isRenderBlockedByCreditPaywall: false
    });
  });

  it("sends a user with no subscription to the paywall instead", () => {
    expect(
      evaluateImageToVideoCreditGate({
        ...subscriberShortOfCredits,
        doesSubscriptionGrantAccess: false
      })
    ).toEqual({
      isRenderBlockedByInsufficientCredits: false,
      isRenderBlockedByCreditPaywall: true
    });
  });

  it("lets an affordable render through", () => {
    expect(
      evaluateImageToVideoCreditGate({
        ...subscriberShortOfCredits,
        userCredits: 3085
      })
    ).toEqual(unblocked);
  });

  it.each(["local-comfy", null] as const)(
    "never gates a render on %s, which Mago credits do not pay for",
    (renderProvider) => {
      expect(
        evaluateImageToVideoCreditGate({
          ...subscriberShortOfCredits,
          renderProvider,
          doesSubscriptionGrantAccess: false
        })
      ).toEqual(unblocked);
    }
  );

  it("does not gate while the balance is unknown, during onboarding, or in unlimited mode", () => {
    for (const overrides of [
      { isCreditBalanceKnown: false },
      { isOnboardingActive: true },
      { isUnlimitedModeActive: true }
    ]) {
      expect(
        evaluateImageToVideoCreditGate({
          ...subscriberShortOfCredits,
          ...overrides
        })
      ).toEqual(unblocked);
    }
  });
});
