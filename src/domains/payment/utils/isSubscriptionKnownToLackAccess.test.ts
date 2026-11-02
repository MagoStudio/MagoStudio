import { describe, expect, it } from "vitest";

import { isSubscriptionKnownToLackAccess } from "./isSubscriptionKnownToLackAccess";

describe("isSubscriptionKnownToLackAccess", () => {
  it("is true once the subscription has loaded and grants no access", () => {
    expect(
      isSubscriptionKnownToLackAccess({
        isSubscriptionLoading: false,
        doesSubscriptionGrantAccess: false
      })
    ).toBe(true);
  });

  it("is false when the subscription grants access", () => {
    expect(
      isSubscriptionKnownToLackAccess({
        isSubscriptionLoading: false,
        doesSubscriptionGrantAccess: true
      })
    ).toBe(false);
  });

  it("is false while the subscription is still loading, because not-yet-known is not the same as absent", () => {
    expect(
      isSubscriptionKnownToLackAccess({
        isSubscriptionLoading: true,
        doesSubscriptionGrantAccess: false
      })
    ).toBe(false);
  });

  it("is false while loading even if access already reads as granted", () => {
    expect(
      isSubscriptionKnownToLackAccess({
        isSubscriptionLoading: true,
        doesSubscriptionGrantAccess: true
      })
    ).toBe(false);
  });
});
