import { describe, expect, it } from "vitest";

import { resolveVoiceUploadContentType } from "./resolveVoiceUploadContentType";

describe("voice upload content types", () => {
  it.each([
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/flac",
    "audio/ogg"
  ])("accepts %s", (type) => {
    expect(resolveVoiceUploadContentType({ name: "sample", type })).toBe(type);
  });
  it.each([
    ["audio/x-m4a", "audio.mp4", "audio/mp4"],
    ["audio/x-flac", "audio.flac", "audio/flac"],
    ["", "RECORDING.WAV", "audio/wav"],
    ["application/octet-stream", "voice.mp3", "audio/mpeg"]
  ])("normalizes %s for %s", (type, name, expected) => {
    expect(resolveVoiceUploadContentType({ name, type })).toBe(expected);
  });
  it("rejects unsupported types even when the extension claims to be audio", () => {
    expect(
      resolveVoiceUploadContentType({ name: "fake.mp3", type: "text/plain" })
    ).toBeUndefined();
    expect(
      resolveVoiceUploadContentType({ name: "voice.webm", type: "audio/webm" })
    ).toBeUndefined();
  });
});
