import { describe, expect, it } from "vitest";

import { resolveSupportedLanguage } from "./resolveSupportedLanguage";

describe("resolveSupportedLanguage", () => {
  it.each([
    [["sv-SE"], "sv"],
    [["sv-FI"], "sv"],
    [["sv_SE"], "sv"],
    [["en-US", "sv-SE"], "en"],
    [["fr-FR", "sv-SE"], "sv"],
    [["en-GB"], "en"]
  ])("maps %j to %s", (systemLanguages, expected) => {
    expect(resolveSupportedLanguage(systemLanguages)).toBe(expected);
  });

  it("falls back to English when no system language is supported", () => {
    expect(resolveSupportedLanguage(["fr-FR", "de-DE"])).toBe("en");
    expect(resolveSupportedLanguage([])).toBe("en");
  });
});
