import { describe, expect, it } from "vitest";

import { getFrameRangeLength } from "./getFrameRangeLength";

describe("getFrameRangeLength", () => {
  it("returns 1 when the range is undefined", () => {
    expect(getFrameRangeLength(undefined)).toBe(1);
  });

  it("returns 1 for a single-frame range", () => {
    expect(getFrameRangeLength([5, 5])).toBe(1);
  });

  it("returns 2 for a two-frame range", () => {
    expect(getFrameRangeLength([5, 6])).toBe(2);
  });

  it("returns an inclusive length for wider ranges", () => {
    expect(getFrameRangeLength([0, 10])).toBe(11);
    expect(getFrameRangeLength([20, 120])).toBe(101);
  });

  it("floors at 1 for an inverted range", () => {
    expect(getFrameRangeLength([10, 5])).toBe(1);
  });
});
