import { describe, expect, it } from "vitest";

import { formatShotDialogue, parseShotDialogue } from "./shotDialogueText";

describe("shot dialogue editing", () => {
  const turns = [
    {
      speaker: "HERO",
      speaker_token: "hero",
      line: "We should go.",
      language: "English"
    }
  ];
  it("round trips speaker binding and language for unchanged dialogue", () => {
    expect(parseShotDialogue(formatShotDialogue(turns), turns)).toEqual(turns);
  });
  it("clears stale metadata when a speaker or spoken line changes", () => {
    expect(parseShotDialogue("HERO: Stay here.\nMEDIC: Go!", turns)).toEqual([
      {
        speaker: "HERO",
        speaker_token: "hero",
        line: "Stay here.",
        language: null
      },
      { speaker: "MEDIC", speaker_token: null, line: "Go!", language: null }
    ]);
  });
  it("allows clearing dialogue and omits blank turns rejected by the backend", () => {
    expect(parseShotDialogue("\nHERO: \n", turns)).toEqual([]);
  });
});
