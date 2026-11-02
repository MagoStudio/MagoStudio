import { describe, expect, test } from "vitest";

import { deriveImageToVideoFrameRange } from "./deriveImageToVideoFrameRange";

describe("deriveImageToVideoFrameRange", () => {
  test("derives an inclusive frame range from duration and fps", () => {
    expect(deriveImageToVideoFrameRange(5, 24)).toEqual([0, 119]);
  });

  test("recomputes when fps changes", () => {
    expect(deriveImageToVideoFrameRange(10, 24)).toEqual([0, 239]);
    expect(deriveImageToVideoFrameRange(10, 30)).toEqual([0, 299]);
  });

  test("rounds a fractional frame count", () => {
    expect(deriveImageToVideoFrameRange(4, 12.5)).toEqual([0, 49]);
  });

  test("floors at 0 rather than going negative", () => {
    expect(deriveImageToVideoFrameRange(0, 24)).toEqual([0, 0]);
  });
});
