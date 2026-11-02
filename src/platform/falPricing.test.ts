import { describe, expect, it } from "vitest";

import { formatFalCost } from "./falPricing";
describe("historical fal cost formatting", () => {
  it("preserves small historical costs", () => {
    expect(formatFalCost(0.0675)).toBe("$0.0675 est.");
    expect(formatFalCost(1.8144)).toBe("$1.81 est.");
  });
});
