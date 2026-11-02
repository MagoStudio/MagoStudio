import { describe, expect, test } from "vitest";

import { getClampedValue } from "./getClampedValue";

describe("getClampedValue", () => {
  test("returns value when within range", () => {
    expect(getClampedValue(5, 0, 10)).toBe(5);
  });

  test("clamps to min when below range", () => {
    expect(getClampedValue(-3, 0, 10)).toBe(0);
  });

  test("clamps to max when above range", () => {
    expect(getClampedValue(42, 0, 10)).toBe(10);
  });

  test("returns min when equal to min", () => {
    expect(getClampedValue(0, 0, 10)).toBe(0);
  });

  test("returns max when equal to max", () => {
    expect(getClampedValue(10, 0, 10)).toBe(10);
  });
});
