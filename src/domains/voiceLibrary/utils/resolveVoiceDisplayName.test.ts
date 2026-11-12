import { describe, expect, it } from "vitest";

import { resolveVoiceDisplayName } from "./resolveVoiceDisplayName";

describe("resolveVoiceDisplayName", () => {
  it("shows the voice's name", () => {
    expect(resolveVoiceDisplayName({ voice_id: "abc", name: "Roger" })).toBe(
      "Roger"
    );
  });

  it("falls back to the voice id when the name is missing or empty", () => {
    expect(resolveVoiceDisplayName({ voice_id: "abc", name: null })).toBe(
      "abc"
    );
    expect(resolveVoiceDisplayName({ voice_id: "abc", name: "" })).toBe("abc");
  });
});
