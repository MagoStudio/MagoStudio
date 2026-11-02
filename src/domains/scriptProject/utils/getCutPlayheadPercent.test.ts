import { describe, expect, it } from "vitest";

import { getCutPlayheadPercent } from "./getCutPlayheadPercent";

describe("getCutPlayheadPercent", () => {
  it("sits at the left edge at the start of the cut", () => {
    expect(getCutPlayheadPercent(0, 240)).toBe(0);
  });

  it("sits halfway through a cut at its midpoint", () => {
    expect(getCutPlayheadPercent(120, 240)).toBe(50);
  });

  it("never runs past the end of the track", () => {
    expect(getCutPlayheadPercent(999, 240)).toBe(100);
  });

  it("stays at the start rather than reporting nothing for an empty cut", () => {
    expect(getCutPlayheadPercent(0, 0)).toBe(0);
  });
});
