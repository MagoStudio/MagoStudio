import { describe, expect, it } from "vitest";

import { isSupportedLanguage } from "./isSupportedLanguage";

describe("isSupportedLanguage", () => {
  it("accepts every supported language code", () => {
    expect(isSupportedLanguage("en")).toBe(true);
    expect(isSupportedLanguage("sv")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isSupportedLanguage("sv-SE")).toBe(false);
    expect(isSupportedLanguage("fr")).toBe(false);
    expect(isSupportedLanguage(null)).toBe(false);
  });
});
