import { describe, expect, it } from "vitest";

import { resolveDefaultSequentialPrompt } from "./resolveDefaultSequentialPrompt";

const DEFAULTS = {
  last_frame: { cut: "Cut text.", pin: "Pin text.", off: "Look text." },
  key_frames: "Key frames text."
};

describe("resolveDefaultSequentialPrompt", () => {
  it("picks a last-frame default by its opening frame", () => {
    expect(
      resolveDefaultSequentialPrompt(DEFAULTS, {
        mode: "last_frame",
        opening_frame: "pin"
      })
    ).toBe("Pin text.");
  });

  it("ignores the opening frame for key frames", () => {
    expect(
      resolveDefaultSequentialPrompt(DEFAULTS, {
        mode: "key_frames",
        opening_frame: "pin"
      })
    ).toBe("Key frames text.");
  });

  it("is null when the backend sent no defaults", () => {
    expect(
      resolveDefaultSequentialPrompt(null, {
        mode: "last_frame",
        opening_frame: "cut"
      })
    ).toBeNull();
  });
});
