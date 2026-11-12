import { SheetGroup } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { listSpeakersWithoutVoice } from "./listSpeakersWithoutVoice";

const look = (token: string, name: string, hasVoice: boolean): SheetGroup =>
  ({
    token,
    name,
    kind: "character",
    enabled: true,
    images: [],
    voice_signature: hasVoice ? { voice_id: `${token}-voice` } : null
  }) as unknown as SheetGroup;

const characterLooks = [
  look("her_emilia", "HER / EMILIA", true),
  look("masha", "MASHA", false)
];

describe("listSpeakersWithoutVoice", () => {
  it("names only connected characters that speak and have no voice", () => {
    expect(
      listSpeakersWithoutVoice({
        dialogue: [
          { speaker: "EMILIA", line: "Hi" },
          { speaker: "MASHA", line: "Hello" },
          { speaker: "V.O.", line: "Wind" }
        ],
        connectedCharacterTokens: new Set(["her_emilia", "masha"]),
        characterLooks
      })
    ).toEqual(["MASHA"]);
  });

  it("names the tagged speaker of a line even when a namesake has a voice", () => {
    expect(
      listSpeakersWithoutVoice({
        dialogue: [{ speaker: "JOHN", speaker_token: "john_doe", line: "Hi" }],
        connectedCharacterTokens: new Set(["john_smith", "john_doe"]),
        characterLooks: [
          look("john_smith", "JOHN SMITH", true),
          look("john_doe", "JOHN DOE", false)
        ]
      })
    ).toEqual(["JOHN DOE"]);
  });
});
