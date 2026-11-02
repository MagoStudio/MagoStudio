import { describe, expect, it } from "vitest";

import { formatSceneShotSeconds } from "./formatSceneShotSeconds";

describe("formatSceneShotSeconds", () => {
  it("keeps one decimal and drops a trailing zero", () => {
    expect(formatSceneShotSeconds(2.34)).toBe("2.3");
    expect(formatSceneShotSeconds(4)).toBe("4");
    expect(formatSceneShotSeconds(3.1 - 0.2)).toBe("2.9");
  });
});
