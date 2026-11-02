import { describe, expect, it } from "vitest";

import { formatShotLabel } from "./formatShotLabel";

describe("formatShotLabel", () => {
  it("zero-pads a single-digit index", () => {
    expect(formatShotLabel(1)).toBe("Shot_01");
  });

  it("keeps a two-digit index unpadded", () => {
    expect(formatShotLabel(10)).toBe("Shot_10");
  });
});
