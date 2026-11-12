import { SheetGroup } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { linkDialogueSpeakersToConnectedVoices } from "./linkDialogueSpeakersToConnectedVoices";

const look = (token: string, name: string, hasVoice = false): SheetGroup =>
  ({
    token,
    name,
    kind: "character",
    enabled: true,
    images: [],
    voice_signature: hasVoice ? { voice_id: `${token}-voice` } : null
  }) as unknown as SheetGroup;

const cast = [
  look("her_emilia", "HER / EMILIA"),
  look("emilia_work_clothes", "EMILIA WORK CLOTHES", true),
  look("tech_2", "TECH 2")
];

const speakerTokens = (connectedTokens: string[]) =>
  linkDialogueSpeakersToConnectedVoices({
    dialogue: [
      { speaker: "HER (V.O.)", line: "Where am I?" },
      { speaker: "TECH 2", line: "Stay still." },
      { speaker: null, line: "Wind." }
    ],
    connectedCharacterTokens: new Set(connectedTokens),
    characterLooks: cast
  }).map((turn) => turn.speaker_token ?? null);

describe("linkDialogueSpeakersToConnectedVoices", () => {
  it("gives a connected character's lines the connected look", () => {
    expect(speakerTokens(["her_emilia", "tech_2"])).toEqual([
      "her_emilia",
      "tech_2",
      null
    ]);
  });

  it("links only to looks named after the speaker", () => {
    expect(
      linkDialogueSpeakersToConnectedVoices({
        dialogue: [{ speaker: "HER", line: "Hi" }],
        connectedCharacterTokens: new Set(["emilia_work_clothes"]),
        characterLooks: cast
      })[0]!.speaker_token
    ).toBeUndefined();
  });

  it("prefers the connected look that has a voice", () => {
    expect(
      linkDialogueSpeakersToConnectedVoices({
        dialogue: [{ speaker: "EMILIA", line: "Hi" }],
        connectedCharacterTokens: new Set([
          "her_emilia",
          "emilia_work_clothes"
        ]),
        characterLooks: cast
      })[0]!.speaker_token
    ).toBe("emilia_work_clothes");
  });

  it("keeps a line on its untagged speaker rather than a namesake still tagged", () => {
    expect(
      linkDialogueSpeakersToConnectedVoices({
        dialogue: [
          { speaker: "ALEX SMITH", speaker_token: "alex_smith", line: "Hi" }
        ],
        connectedCharacterTokens: new Set(["alex_jones"]),
        characterLooks: [
          look("alex_smith", "ALEX SMITH"),
          look("alex_jones", "ALEX JONES")
        ]
      })[0]!.speaker_token
    ).toBe("alex_smith");
  });

  it("keeps a line on its tagged speaker rather than a voiced namesake", () => {
    expect(
      linkDialogueSpeakersToConnectedVoices({
        dialogue: [{ speaker: "JOHN", speaker_token: "john_doe", line: "Hi" }],
        connectedCharacterTokens: new Set(["john_smith", "john_doe"]),
        characterLooks: [
          look("john_smith", "JOHN SMITH", true),
          look("john_doe", "JOHN DOE")
        ]
      })[0]!.speaker_token
    ).toBe("john_doe");
  });

  it("moves a line to the tagged look when its speaker's look was swapped out", () => {
    expect(
      linkDialogueSpeakersToConnectedVoices({
        dialogue: [
          { speaker: "EMILIA", speaker_token: "her_emilia", line: "Hi" }
        ],
        connectedCharacterTokens: new Set(["emilia_work_clothes"]),
        characterLooks: cast
      })[0]!.speaker_token
    ).toBe("emilia_work_clothes");
  });

  it("leaves lines of characters that are not connected as they were", () => {
    expect(speakerTokens([])).toEqual([null, null, null]);
  });
});
