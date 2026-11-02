import { describe, expect, it } from "vitest";

import { buildEmptySceneShotDraft } from "./buildEmptySceneShotDraft";
import { buildStoryboardBeatsFromSceneShots } from "./buildStoryboardBeatsFromSceneShots";

describe("buildStoryboardBeatsFromSceneShots", () => {
  it("makes one storyboard beat per filled shot, in order", () => {
    expect(
      buildStoryboardBeatsFromSceneShots([
        {
          ...buildEmptySceneShotDraft("shot-1"),
          durationSeconds: "2.5",
          framing: "Wide",
          cameraMovement: "slow push in",
          description: "The rooftop at dawn.",
          dialogue: "HER: Where am I?"
        },
        { ...buildEmptySceneShotDraft("blank"), durationSeconds: "" },
        {
          ...buildEmptySceneShotDraft("shot-2"),
          framing: "",
          cameraMovement: "",
          description: "She sits up."
        }
      ])
    ).toEqual([
      {
        framing: "Wide",
        action: "The rooftop at dawn.",
        cameraMovement: "slow push in",
        cameraSentenceKind: "move",
        spokenLines: "HER: Where am I?",
        durationSeconds: 2.5
      },
      {
        framing: "",
        action: "She sits up.",
        cameraMovement: "",
        cameraSentenceKind: "none",
        spokenLines: "",
        durationSeconds: 0
      }
    ]);
  });
});
