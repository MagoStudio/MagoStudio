import { describe, expect, it } from "vitest";

import { parseSceneShotsFromVideoPrompt } from "./parseSceneShotsFromVideoPrompt";
import { resolveSceneShotDraftEdits } from "./resolveSceneShotDraftEdits";

const savedScene = {
  timeline_id: "scene",
  duration_s: 5,
  video_prompt:
    "[Shot 2] (0.2.1s) Extreme Close-up. Wind tangles her hair.  \nStyle: cel.",
  dialogue: []
};

describe("resolveSceneShotDraftEdits", () => {
  it("reports no edits for an untouched scene, even when its prompt is irregular", () => {
    expect(
      resolveSceneShotDraftEdits({
        shot: savedScene,
        sceneShotLayout: parseSceneShotsFromVideoPrompt(savedScene)
      })
    ).toEqual({ unsavedEdits: {}, sceneDurationSeconds: 5 });
  });

  it("reports the rebuilt prompt and the summed length once shots are edited", () => {
    const layout = parseSceneShotsFromVideoPrompt({
      ...savedScene,
      video_prompt: "[Shot 1] (0-2s) Wide. Rooftop."
    });
    const editedLayout = {
      ...layout,
      shots: [
        ...layout.shots,
        {
          draftId: "added",
          durationSeconds: "4",
          framing: "",
          cameraMovement: "",
          description: "She stands.",
          dialogue: ""
        }
      ]
    };

    expect(
      resolveSceneShotDraftEdits({
        shot: { ...savedScene, video_prompt: "[Shot 1] (0-2s) Wide. Rooftop." },
        sceneShotLayout: editedLayout
      })
    ).toEqual({
      unsavedEdits: {
        videoPrompt:
          "[Shot 1] (0-2s) Wide. Rooftop.\n[Shot 2] (2-6s) She stands.",
        dialogue: [],
        durationSeconds: 6
      },
      sceneDurationSeconds: 6
    });
  });

  it("reports no length edit when the saved length differs from the prompt's shot timings", () => {
    const sceneWithCalibratedLength = {
      ...savedScene,
      duration_s: 5.04,
      video_prompt: "[Shot 1] (0-3s) A.\n[Shot 2] (3-6s) B."
    };

    expect(
      resolveSceneShotDraftEdits({
        shot: sceneWithCalibratedLength,
        sceneShotLayout: parseSceneShotsFromVideoPrompt(
          sceneWithCalibratedLength
        )
      })
    ).toEqual({ unsavedEdits: {}, sceneDurationSeconds: 6 });
  });

  it("reports no length edit for an untouched plain prompt with a frame-derived length", () => {
    const plainScene = {
      ...savedScene,
      duration_s: 5.0417,
      video_prompt: "A wide shot of the rooftop at dusk."
    };

    expect(
      resolveSceneShotDraftEdits({
        shot: plainScene,
        sceneShotLayout: parseSceneShotsFromVideoPrompt(plainScene)
      })
    ).toEqual({ unsavedEdits: {}, sceneDurationSeconds: 5 });
  });
});
