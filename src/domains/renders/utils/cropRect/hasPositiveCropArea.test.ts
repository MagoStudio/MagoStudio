import { describe, expect, it } from "vitest";

import { hasPositiveCropArea } from "./hasPositiveCropArea";

describe("hasPositiveCropArea", () => {
  it("returns true for a box with positive width and height", () => {
    expect(
      hasPositiveCropArea({ crop: { x: 0, y: 0, width: 0.5, height: 0.5 } })
    ).toBe(true);
  });

  it("returns false for a zero-width box", () => {
    expect(
      hasPositiveCropArea({ crop: { x: 0.5, y: 0, width: 0, height: 0.5 } })
    ).toBe(false);
  });

  it("returns false for a zero-height box", () => {
    expect(
      hasPositiveCropArea({ crop: { x: 0, y: 0.5, width: 0.5, height: 0 } })
    ).toBe(false);
  });

  it("returns false for a negative-area box", () => {
    expect(
      hasPositiveCropArea({ crop: { x: 0, y: 0, width: -0.1, height: 0.5 } })
    ).toBe(false);
  });

  it("returns false when width is NaN", () => {
    expect(
      hasPositiveCropArea({
        crop: { x: 0, y: 0, width: NaN, height: 0.5 }
      })
    ).toBe(false);
  });

  it("returns false when x is non-numeric", () => {
    expect(
      hasPositiveCropArea({
        crop: { x: "a" as unknown as number, y: 0, width: 0.5, height: 0.5 }
      })
    ).toBe(false);
  });
});
