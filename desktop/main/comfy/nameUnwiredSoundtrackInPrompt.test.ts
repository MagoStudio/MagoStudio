import { describe, expect, it } from "vitest";

import { nameUnwiredSoundtrackInPrompt } from "./nameUnwiredSoundtrackInPrompt";

describe("nameUnwiredSoundtrackInPrompt", () => {
  it("names every audio tag in words, since no audio reference exists", () => {
    expect(
      nameUnwiredSoundtrackInPrompt("keep <Audio 1>, then mix in <Audio 2>")
    ).toBe("keep the soundtrack, then mix in the soundtrack");
  });

  it("leaves picture and video tags alone", () => {
    expect(nameUnwiredSoundtrackInPrompt("<Video 1> meets <Picture 1>")).toBe(
      "<Video 1> meets <Picture 1>"
    );
  });
});
