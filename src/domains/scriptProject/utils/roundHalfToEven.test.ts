import { describe, expect, it } from "vitest";

import { roundHalfToEven } from "./roundHalfToEven";

describe("roundHalfToEven", () => {
  it("rounds a tie down to the even neighbour", () => {
    expect(roundHalfToEven(6.5)).toBe(6);
  });

  it("rounds a tie up to the even neighbour", () => {
    expect(roundHalfToEven(7.5)).toBe(8);
  });

  it("rounds a non-tie to the nearest integer as usual", () => {
    expect(roundHalfToEven(6.4)).toBe(6);
    expect(roundHalfToEven(6.6)).toBe(7);
  });

  it("leaves a whole number unchanged", () => {
    expect(roundHalfToEven(5)).toBe(5);
  });
});
