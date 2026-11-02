import { describe, expect, it } from "vitest";

import { applyMinimumSceneShotDuration } from "./applyMinimumSceneShotDuration";

describe("applyMinimumSceneShotDuration", () => {
  it("turns an emptied duration into the 1 second minimum", () => {
    expect(applyMinimumSceneShotDuration("")).toBe("1");
  });

  it("raises a duration below 1 second to the minimum", () => {
    expect(applyMinimumSceneShotDuration("0.4")).toBe("1");
  });

  it("keeps a duration at or above the minimum as typed", () => {
    expect(applyMinimumSceneShotDuration("2.5")).toBe("2.5");
  });
});
