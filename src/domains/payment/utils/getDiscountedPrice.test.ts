import { describe, expect, it } from "vitest";

import { getDiscountedPrice } from "./getDiscountedPrice";

describe("getDiscountedPrice", () => {
  it("computes the discounted price from conditional_discount", () => {
    expect(
      getDiscountedPrice({ price: 3500, conditional_discount: 20 })
    ).toEqual({ original: 3500, discounted: 2800 });
  });

  it("returns undefined when the key is absent", () => {
    expect(getDiscountedPrice({ price: 3500 })).toBeUndefined();
  });

  it("treats a present zero discount as a discount, not as absent", () => {
    expect(
      getDiscountedPrice({ price: 3500, conditional_discount: 0 })
    ).toEqual({ original: 3500, discounted: 3500 });
  });

  it("returns the exact product for a fractional result (no rounding in the util)", () => {
    const result = getDiscountedPrice({ price: 999, conditional_discount: 15 });
    expect(result?.original).toBe(999);
    expect(result?.discounted).toBeCloseTo(849.15, 5);
  });
});
