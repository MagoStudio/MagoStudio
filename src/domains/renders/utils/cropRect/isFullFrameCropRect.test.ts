import { describe, expect, it } from "vitest";

import { isFullFrameCropRect } from "./isFullFrameCropRect";

describe("isFullFrameCropRect", () => {
  it("detects a box covering the entire frame as full-frame", () => {
    expect(
      isFullFrameCropRect({ crop: { x: 0, y: 0, width: 1, height: 1 } })
    ).toBe(true);
  });

  it("detects a box covering only part of the frame as not full-frame", () => {
    expect(
      isFullFrameCropRect({ crop: { x: 0.5, y: 0, width: 0.5, height: 1 } })
    ).toBe(false);
  });

  it("tolerates floating point rounding noise at the frame edges", () => {
    expect(
      isFullFrameCropRect({
        crop: { x: 0.0001, y: -0.0001, width: 0.9999, height: 1.0001 }
      })
    ).toBe(true);
  });
});
