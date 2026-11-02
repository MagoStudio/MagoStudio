import { describe, expect, it } from "vitest";

import { getNavbarSubscriptionEntry } from "./getNavbarSubscriptionEntry";

describe("getNavbarSubscriptionEntry", () => {
  it("shows the pricing link to a subscriber whose subscription grants access", () => {
    expect(
      getNavbarSubscriptionEntry({
        isSubscriptionLoading: false,
        doesSubscriptionGrantAccess: true
      })
    ).toBe("pricing-link");
  });

  it("shows Subscribe when the subscription grants no access", () => {
    expect(
      getNavbarSubscriptionEntry({
        isSubscriptionLoading: false,
        doesSubscriptionGrantAccess: false
      })
    ).toBe("subscribe");
  });

  it("shows nothing while the subscription is still loading", () => {
    expect(
      getNavbarSubscriptionEntry({
        isSubscriptionLoading: true,
        doesSubscriptionGrantAccess: false
      })
    ).toBe("nothing");
  });

  it("never offers Subscribe to a subscriber whose data has not arrived yet", () => {
    expect(
      getNavbarSubscriptionEntry({
        isSubscriptionLoading: true,
        doesSubscriptionGrantAccess: true
      })
    ).toBe("nothing");
  });
});
