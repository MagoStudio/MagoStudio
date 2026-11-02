import { describe, expect, it } from "vitest";

import { roundSceneShotSeconds } from "./roundSceneShotSeconds";

describe("roundSceneShotSeconds", () => {
  it("rounds to a tenth of a second", () => {
    expect(roundSceneShotSeconds(1.5 + 3.2)).toBe(4.7);
    expect(roundSceneShotSeconds(2.34)).toBe(2.3);
  });
});
