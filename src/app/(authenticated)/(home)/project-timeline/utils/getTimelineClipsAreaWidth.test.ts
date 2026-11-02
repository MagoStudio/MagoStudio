import { describe, expect, it } from "vitest";

import { getTimelineClipsAreaWidth } from "./getTimelineClipsAreaWidth";

describe("getTimelineClipsAreaWidth", () => {
  it("returns content width minus 10% add cell minus 10px padding", () => {
    expect(getTimelineClipsAreaWidth(1000)).toBe(890);
  });

  it("scales the add cell with content width", () => {
    expect(getTimelineClipsAreaWidth(2000)).toBe(1790);
  });

  it("returns 0 when content width is 0", () => {
    expect(getTimelineClipsAreaWidth(0)).toBe(0);
  });

  it("returns 0 for negative content width", () => {
    expect(getTimelineClipsAreaWidth(-100)).toBe(0);
  });

  it("clamps to 0 when content width is smaller than padding overhead", () => {
    expect(getTimelineClipsAreaWidth(5)).toBe(0);
  });

  it("handles a narrow but valid content width", () => {
    expect(getTimelineClipsAreaWidth(100)).toBe(80);
  });
});
