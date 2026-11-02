import { describe, expect, it } from "vitest";

import { getTimelineContentWidth } from "./getTimelineContentWidth";

describe("getTimelineContentWidth", () => {
  const VIEWPORT_WIDTH = 1000;

  it("returns viewport width at default 50% zoom", () => {
    expect(getTimelineContentWidth(VIEWPORT_WIDTH, 50)).toBe(1000);
  });

  it("returns half viewport width at 25% zoom", () => {
    expect(getTimelineContentWidth(VIEWPORT_WIDTH, 25)).toBe(500);
  });

  it("returns double viewport width at 100% zoom", () => {
    expect(getTimelineContentWidth(VIEWPORT_WIDTH, 100)).toBe(2000);
  });

  it("returns 4x viewport width at 200% zoom", () => {
    expect(getTimelineContentWidth(VIEWPORT_WIDTH, 200)).toBe(4000);
  });

  it("returns 0 when viewport width is 0", () => {
    expect(getTimelineContentWidth(0, 100)).toBe(0);
  });
});
