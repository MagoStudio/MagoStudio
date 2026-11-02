import { describe, expect, it } from "vitest";

import { resolveIsBulkRendersRunBalanceSufficient } from "./resolveIsBulkRendersRunBalanceSufficient";

describe("resolveIsBulkRendersRunBalanceSufficient", () => {
  it("is sufficient when the balance covers the estimate", () => {
    expect(
      resolveIsBulkRendersRunBalanceSufficient({
        couldNotBePriced: false,
        balanceAmount: 100,
        estimatedRemainingCredits: 50
      })
    ).toBe(true);
  });

  it("is insufficient when the balance falls short of a known estimate", () => {
    expect(
      resolveIsBulkRendersRunBalanceSufficient({
        couldNotBePriced: false,
        balanceAmount: 10,
        estimatedRemainingCredits: 50
      })
    ).toBe(false);
  });

  it("is sufficient when the estimate could not be priced, regardless of balance", () => {
    expect(
      resolveIsBulkRendersRunBalanceSufficient({
        couldNotBePriced: true,
        balanceAmount: 0,
        estimatedRemainingCredits: 999999
      })
    ).toBe(true);
  });

  it("stays sufficient while the balance is not yet known, rather than reading as zero", () => {
    expect(
      resolveIsBulkRendersRunBalanceSufficient({
        couldNotBePriced: false,
        balanceAmount: undefined,
        estimatedRemainingCredits: 1
      })
    ).toBe(true);
  });
});
