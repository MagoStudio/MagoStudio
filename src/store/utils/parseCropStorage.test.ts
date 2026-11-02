import { describe, expect, it } from "vitest";

import { parseCropStorage } from "./parseCropStorage";

const fallback = { crop: undefined };

describe("parseCropStorage", () => {
  it("falls back to the default storage when the stored value is null", () => {
    expect(parseCropStorage(null, fallback)).toBe(fallback);
  });

  it("falls back to the default storage when the stored value is not an object", () => {
    expect(parseCropStorage("not-an-object", fallback)).toBe(fallback);
  });

  it("falls back to the default storage when a crop member is non-numeric", () => {
    expect(
      parseCropStorage(
        { crop: { x: "a", y: 0, width: 0.5, height: 0.5 } },
        fallback
      )
    ).toBe(fallback);
  });

  it("falls back to the default storage when a crop member is out of range", () => {
    expect(
      parseCropStorage(
        { crop: { x: 1.5, y: 0, width: 0.5, height: 0.5 } },
        fallback
      )
    ).toBe(fallback);
  });

  it("falls back to the default storage when the crop area is not positive", () => {
    expect(
      parseCropStorage(
        { crop: { x: 0, y: 0, width: 0, height: 0.5 } },
        fallback
      )
    ).toBe(fallback);
  });

  it("passes through a valid crop value untouched", () => {
    const stored = { crop: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 } };
    expect(parseCropStorage(stored, fallback)).toEqual(stored);
  });

  it("passes through an explicitly undefined crop", () => {
    expect(parseCropStorage({ crop: undefined }, fallback)).toEqual({
      crop: undefined
    });
  });
});
