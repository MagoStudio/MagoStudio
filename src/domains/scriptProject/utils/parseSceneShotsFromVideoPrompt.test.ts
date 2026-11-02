import { ShotDialogueTurn } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { parseSceneShotsFromVideoPrompt } from "./parseSceneShotsFromVideoPrompt";

const dialogueTurn = (speaker: string, line: string): ShotDialogueTurn => ({
  speaker,
  line,
  speaker_token: null,
  language: null
});

describe("parseSceneShotsFromVideoPrompt", () => {
  it("reads a prompt without shot headings as one shot", () => {
    expect(
      parseSceneShotsFromVideoPrompt({
        timeline_id: "scene",
        duration_s: 5,
        video_prompt: "Ruby runs home.",
        dialogue: [dialogueTurn("RUBY", "Wait!")]
      })
    ).toEqual({
      textBeforeShots: "",
      textAfterShots: "",
      shots: [
        {
          draftId: "scene-1",
          durationSeconds: "5",
          framing: "",
          cameraMovement: "",
          description: "Ruby runs home.",
          dialogue: "RUBY: Wait!"
        }
      ]
    });
  });

  it("splits shot headings into timing, framing, description, camera and dialogue", () => {
    const layout = parseSceneShotsFromVideoPrompt({
      timeline_id: "scene",
      duration_s: 8,
      video_prompt:
        "They are mid-conversation.\n[Shot 1] (0-4.9s) Close-up on her hands. She grips her knees. The camera holds steady with no added movement. HER (V.O. ): {{line:1}}\n[Shot 2] (4.9-8s) Medium close-up. Her expression reveals horror. Camera: slow push in.\nStyle: cel animation.",
      dialogue: [dialogueTurn("HER (V.O. )", "Yesterday, I died.")]
    });

    expect(layout.textBeforeShots).toBe("They are mid-conversation.");
    expect(layout.textAfterShots).toBe("Style: cel animation.");
    expect(layout.shots).toEqual([
      {
        draftId: "scene-1",
        durationSeconds: "4.9",
        framing: "Close-up on her hands",
        cameraMovement: "The camera holds steady with no added movement.",
        description: "She grips her knees.",
        dialogue: "HER (V.O. ): Yesterday, I died."
      },
      {
        draftId: "scene-2",
        durationSeconds: "3.1",
        framing: "Medium close-up",
        cameraMovement: "slow push in",
        description: "Her expression reveals horror.",
        dialogue: ""
      }
    ]);
  });

  it("gives dialogue no shot refers to the first shot", () => {
    const layout = parseSceneShotsFromVideoPrompt({
      timeline_id: "scene",
      duration_s: 4,
      video_prompt: "[Shot 1] (0-4s) Wide. Rooftop.",
      dialogue: [dialogueTurn("HER", "Hello.")]
    });

    expect(layout.shots[0]?.dialogue).toBe("HER: Hello.");
  });
});
