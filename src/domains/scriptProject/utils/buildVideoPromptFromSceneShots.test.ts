import { ShotDialogueTurn } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { buildEmptySceneShotDraft } from "./buildEmptySceneShotDraft";
import { buildVideoPromptFromSceneShots } from "./buildVideoPromptFromSceneShots";
import { parseSceneShotsFromVideoPrompt } from "./parseSceneShotsFromVideoPrompt";

const dialogueTurn = (speaker: string, line: string): ShotDialogueTurn => ({
  speaker,
  line,
  speaker_token: null,
  language: null
});

describe("buildVideoPromptFromSceneShots", () => {
  it("writes a one-shot scene as shot 1 with its default framing and camera", () => {
    expect(
      buildVideoPromptFromSceneShots(
        {
          textBeforeShots: "",
          textAfterShots: "",
          shots: [
            {
              ...buildEmptySceneShotDraft("scene-1"),
              durationSeconds: "5",
              description: "Ruby runs home.",
              dialogue: "RUBY: Wait!"
            }
          ]
        },
        []
      )
    ).toEqual({
      videoPrompt:
        "[Shot 1] (0-5s) Medium close-up. Ruby runs home. Camera: Static. RUBY: {{line:1}}",
      dialogue: [dialogueTurn("RUBY", "Wait!")]
    });
  });

  it("keeps a multi-line description of the last shot inside that shot after a reload", () => {
    const { videoPrompt } = buildVideoPromptFromSceneShots(
      {
        textBeforeShots: "",
        textAfterShots: "",
        shots: [
          {
            ...buildEmptySceneShotDraft("scene-1"),
            durationSeconds: "5",
            description: "Ruby runs home."
          },
          {
            ...buildEmptySceneShotDraft("scene-2"),
            durationSeconds: "5",
            description: "He turns.\nShe leaves."
          }
        ]
      },
      []
    );
    const reloadedLayout = parseSceneShotsFromVideoPrompt({
      timeline_id: "scene",
      duration_s: 10,
      video_prompt: videoPrompt,
      dialogue: []
    });

    expect(reloadedLayout.shots[1]?.description).toBe("He turns. She leaves.");
    expect(reloadedLayout.textAfterShots).toBe("");
    expect(buildVideoPromptFromSceneShots(reloadedLayout, []).videoPrompt).toBe(
      videoPrompt
    );
  });

  it("writes timed shot headings with framing, camera and dialogue references", () => {
    const { videoPrompt, dialogue } = buildVideoPromptFromSceneShots(
      {
        textBeforeShots: "",
        textAfterShots: "Style: cel animation.",
        shots: [
          {
            ...buildEmptySceneShotDraft("scene-1"),
            durationSeconds: "2.5",
            framing: "Wide",
            description: "The rooftop at dawn",
            cameraMovement: "Static",
            dialogue: "Her: Where am I?"
          },
          buildEmptySceneShotDraft("blank"),
          {
            ...buildEmptySceneShotDraft("scene-2"),
            durationSeconds: "3",
            description: "She sits up.",
            dialogue: "HIM: Stay down.\nHER: No."
          }
        ]
      },
      []
    );

    expect(videoPrompt).toBe(
      "[Shot 1] (0-2.5s) Wide. The rooftop at dawn. Camera: Static. HER: {{line:1}}\n[Shot 2] (2.5-5.5s) Medium close-up. She sits up. Camera: Static. HIM: {{line:2}} HER: {{line:3}}\nStyle: cel animation."
    );
    expect(dialogue.map((turn) => turn.line)).toEqual([
      "Where am I?",
      "Stay down.",
      "No."
    ]);
  });

  it("stops writing timings after a shot without a duration", () => {
    const { videoPrompt } = buildVideoPromptFromSceneShots(
      {
        textBeforeShots: "",
        textAfterShots: "",
        shots: [
          {
            ...buildEmptySceneShotDraft("scene-1"),
            framing: "Wide",
            description: "Rooftop."
          },
          {
            ...buildEmptySceneShotDraft("scene-2"),
            durationSeconds: "2",
            description: "Close on her."
          }
        ]
      },
      []
    );

    expect(videoPrompt).toBe(
      "[Shot 1] Wide. Rooftop. Camera: Static.\n[Shot 2] Medium close-up. Close on her. Camera: Static."
    );
  });

  it("round-trips a generated multi-shot prompt", () => {
    const shot = {
      timeline_id: "scene",
      duration_s: 8,
      video_prompt:
        "[Shot 1] (0-4.9s) Close-up. She grips her knees. The camera holds steady with no added movement. HER: {{line:1}}\n[Shot 2] (4.9-8s) Medium close-up. Her expression reveals horror. Camera: slow push in.\nStyle: cel animation.",
      dialogue: [dialogueTurn("HER", "Yesterday, I died.")]
    };

    const rebuilt = buildVideoPromptFromSceneShots(
      parseSceneShotsFromVideoPrompt(shot),
      shot.dialogue
    );

    expect(rebuilt.videoPrompt).toBe(shot.video_prompt);
    expect(rebuilt.dialogue).toEqual(shot.dialogue);
  });
});
