import { describe, expect, it } from "vitest";

import { formatStockVoiceTags } from "./formatStockVoiceTags";

describe("formatStockVoiceTags", () => {
  it("joins the provider's tags into one capitalized line", () => {
    expect(formatStockVoiceTags(["middle_aged", "male", "american"])).toBe(
      "Middle Aged · Male · American"
    );
  });

  it("capitalizes each part of a hyphenated tag", () => {
    expect(formatStockVoiceTags(["laid-back", "down-to-earth"])).toBe(
      "Laid-Back · Down-To-Earth"
    );
  });

  it("is empty when the voice has no tags", () => {
    expect(formatStockVoiceTags([])).toBe("");
  });
});
