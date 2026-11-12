import { describe, expect, it } from "vitest";

import { hasCharacterReadyVoice } from "./hasCharacterReadyVoice";

describe("hasCharacterReadyVoice", () => {
  it("counts a chosen library voice as a ready voice", () => {
    expect(
      hasCharacterReadyVoice({
        voice_signature: {
          provider: "elevenlabs",
          voice_id: "CwhRBWXzGAHq8TQ4Fs17",
          preview_url: null
        }
      })
    ).toBe(true);
  });

  it("is false with no library voice", () => {
    expect(hasCharacterReadyVoice({ voice_signature: null })).toBe(false);
  });
});
