import { describe, expect, it } from "vitest";

import {
  listCastCharacterTokens,
  listUntaggedSpeakers,
  normalizeSheetToken,
  resolveDialogueSpeakerToken
} from "./untaggedSpeakers";

const cast = new Set(["john", "mary"]);

describe("untagged speakers (script_project.untagged_speakers)", () => {
  it("lists speakers not tagged in the shot, in first-spoken order, once each", () => {
    expect(
      listUntaggedSpeakers(
        [
          { speaker_token: "mary", line: "Hi." },
          { speaker_token: "john", line: "Hello." },
          { speaker_token: "mary", line: "Again." }
        ],
        { characters: ["john"] },
        cast
      )
    ).toEqual(["mary"]);
  });

  it("resolves a cue name only when it is a cast character", () => {
    expect(
      listUntaggedSpeakers(
        [
          { speaker: "MARY (V.O.)", line: "Far away." },
          { speaker: "POLICE OFFICER", line: "Stop." }
        ],
        { characters: [] },
        cast
      )
    ).toEqual(["mary"]);
  });

  it("skips empty lines and returns nothing when every speaker is tagged", () => {
    expect(
      listUntaggedSpeakers(
        [
          { speaker_token: "mary", line: "  " },
          { speaker_token: "john", line: "Hello." }
        ],
        { characters: ["john"] },
        cast
      )
    ).toEqual([]);
  });

  it("counts switched-off characters as cast and ignores other kinds", () => {
    expect(
      listCastCharacterTokens([
        { token: "john", kind: "character", enabled: false },
        { token: "field", kind: "environment" }
      ])
    ).toEqual(new Set(["john"]));
  });

  it("normalises tokens like the backend", () => {
    expect(normalizeSheetToken("  Sergeant O'Neil ")).toBe("sergeant_o_neil");
    expect(normalizeSheetToken("!!")).toBeNull();
    expect(resolveDialogueSpeakerToken({ speaker: "MARY (CONT'D)" })).toBe(
      "mary"
    );
  });
});
