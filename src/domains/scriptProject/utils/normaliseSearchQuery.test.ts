import { describe, expect, it } from "vitest";

import { normaliseSearchQuery } from "./normaliseSearchQuery";

describe("normaliseSearchQuery", () => {
  it("lowercases and trims", () => {
    expect(normaliseSearchQuery("  Sergeant  ")).toBe("sergeant");
  });

  it("treats a missing value as an empty query", () => {
    expect(normaliseSearchQuery(null)).toBe("");
    expect(normaliseSearchQuery(undefined)).toBe("");
  });
});
