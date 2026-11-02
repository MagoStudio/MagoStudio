import { describe, expect, it } from "vitest";

import { findNearestMinimaxResolutionTier } from "./findNearestMinimaxResolutionTier";

describe("findNearestMinimaxResolutionTier", () => {
  it("matches a short edge exactly on a tier", () => {
    expect(findNearestMinimaxResolutionTier(768)).toBe("768P");
    expect(findNearestMinimaxResolutionTier(1080)).toBe("1080P");
    expect(findNearestMinimaxResolutionTier(480)).toBe("480P");
  });

  it("rounds a short edge between tiers to the nearest one", () => {
    expect(findNearestMinimaxResolutionTier(720)).toBe("768P");
  });
});
