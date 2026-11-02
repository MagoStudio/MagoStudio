import { describe, expect, it } from "vitest";

import { entityDescriptionPrompt } from "./entityDescription";

describe("entityDescriptionPrompt", () => {
  it("uses the production entity facets and excludes sheet layout", () => {
    const result = entityDescriptionPrompt("environment");

    expect(result.kind).toBe("environment");
    expect(result.prompt).toContain("architecture and materials");
    expect(result.prompt).toContain("Ignore the sheet's layout entirely");
    expect(result.prompt).toContain("say nothing about multiple views");
  });

  it("falls back to character for an unknown kind", () => {
    const result = entityDescriptionPrompt("unknown");

    expect(result.kind).toBe("character");
    expect(result.prompt).toContain("age, build, face, hair");
  });
});
