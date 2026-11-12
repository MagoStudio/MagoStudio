import { describe, expect, it } from "vitest";

import { buildVoiceSignatureFromStockVoice } from "./buildVoiceSignatureFromStockVoice";

describe("buildVoiceSignatureFromStockVoice", () => {
  it("links the stock voice by provider and voice id, caching its name, tags and preview", () => {
    expect(
      buildVoiceSignatureFromStockVoice({
        voice_id: "CwhRBWXzGAHq8TQ4Fs17",
        name: "Roger",
        tags: ["male"],
        preview_url: "https://example.com/roger.mp3"
      })
    ).toEqual({
      provider: "elevenlabs",
      voice_id: "CwhRBWXzGAHq8TQ4Fs17",
      name: "Roger",
      tags: ["male"],
      preview_url: "https://example.com/roger.mp3"
    });
  });

  it("stores null for a missing name or preview", () => {
    expect(
      buildVoiceSignatureFromStockVoice({ voice_id: "abc", tags: [] })
    ).toEqual({
      provider: "elevenlabs",
      voice_id: "abc",
      name: null,
      tags: [],
      preview_url: null
    });
  });
});
