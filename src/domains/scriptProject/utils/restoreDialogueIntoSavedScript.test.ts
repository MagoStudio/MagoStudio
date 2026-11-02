import { AgentScriptDocument } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { restoreDialogueIntoSavedScript } from "./restoreDialogueIntoSavedScript";

const buildDocument = (
  scenes: { prompt: string; dialogue_or_vo?: string | null }[]
): AgentScriptDocument =>
  ({
    scenes: scenes.map((scene, index) => ({
      scene_number: index + 1,
      reference_tags: [],
      ...scene
    })),
    screenplay_scenes: [],
    hashtags: []
  }) as AgentScriptDocument;

const DOCUMENT_WITH_DIALOGUE = buildDocument([
  { prompt: "Wide of the ship." },
  { prompt: "Alex in the cockpit.", dialogue_or_vo: "ALEX: Do you see this?" }
]);

const PROMPT_ONLY_SCRIPT =
  "Shot 1:\nWide of the ship.\n\nShot 2:\nAlex in the cockpit.";

describe("restoreDialogueIntoSavedScript", () => {
  it("adds the saved dialogue back to an untouched prompt-only script", () => {
    expect(
      restoreDialogueIntoSavedScript(PROMPT_ONLY_SCRIPT, DOCUMENT_WITH_DIALOGUE)
    ).toBe(
      "Shot 1:\nWide of the ship.\n\nShot 2:\nAlex in the cockpit.\nALEX: Do you see this?"
    );
  });

  it("leaves a script the user edited by hand alone", () => {
    const editedScript = `${PROMPT_ONLY_SCRIPT}\n\nShot 3:\nMy own shot.`;

    expect(
      restoreDialogueIntoSavedScript(editedScript, DOCUMENT_WITH_DIALOGUE)
    ).toBe(editedScript);
  });

  it("changes nothing when the document holds no dialogue", () => {
    expect(
      restoreDialogueIntoSavedScript(
        PROMPT_ONLY_SCRIPT,
        buildDocument([
          { prompt: "Wide of the ship." },
          { prompt: "Alex in the cockpit.", dialogue_or_vo: "  " }
        ])
      )
    ).toBe(PROMPT_ONLY_SCRIPT);
  });

  it("changes nothing without a document", () => {
    expect(restoreDialogueIntoSavedScript(PROMPT_ONLY_SCRIPT, null)).toBe(
      PROMPT_ONLY_SCRIPT
    );
  });

  it("keeps a script that already shows its dialogue", () => {
    const scriptWithDialogue =
      "Shot 1:\nWide of the ship.\n\nShot 2:\nAlex in the cockpit.\nALEX: Do you see this?";

    expect(
      restoreDialogueIntoSavedScript(scriptWithDialogue, DOCUMENT_WITH_DIALOGUE)
    ).toBe(scriptWithDialogue);
  });
});
