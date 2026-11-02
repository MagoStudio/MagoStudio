import { describe, expect, it } from "vitest";

import { getDurationFromFrameRange } from "./getDurationFromFrameRange";

describe("getDurationFromFrameRange", () => {
  it("returns the inclusive frame count divided by fps", () => {
    expect(getDurationFromFrameRange([0, 48], 24)).toBe(49 / 24);
  });

  it("returns exactly 5 seconds for a 120-frame range at 24fps", () => {
    expect(getDurationFromFrameRange([0, 119], 24)).toBe(5);
  });

  it("returns a fractional duration for a range shorter than a second", () => {
    expect(getDurationFromFrameRange([10, 21], 24)).toBe(0.5);
  });

  it("returns one frame's duration for a range with no length", () => {
    expect(getDurationFromFrameRange([30, 30], 24)).toBe(1 / 24);
  });

  it("measures the inclusive count rather than the end frame", () => {
    expect(getDurationFromFrameRange([100, 147], 24)).toBe(2);
  });
});
