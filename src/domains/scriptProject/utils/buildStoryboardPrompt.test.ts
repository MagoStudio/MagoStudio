import { describe, expect, it } from "vitest";

import { SCRIPT_PROJECT_ASPECT_RATIOS } from "../constants";

import { buildStoryboardPrompt } from "./buildStoryboardPrompt";
import { Beat } from "./shotCutListTypes";

const landscapeAspectRatio = SCRIPT_PROJECT_ASPECT_RATIOS[0];

const beat = (overrides: Partial<Beat>): Beat => ({
  framing: "",
  action: "",
  cameraMovement: "",
  cameraSentenceKind: "none",
  spokenLines: "",
  durationSeconds: 0,
  ...overrides
});

describe("buildStoryboardPrompt", () => {
  it("describes the grid and one numbered panel per beat", () => {
    const prompt = buildStoryboardPrompt({
      cutList: {
        sceneDescription: "",
        midExchangeOpening: "",
        beats: [
          beat({ framing: "Wide", action: "The rooftop at dawn." }),
          beat({
            framing: "Close-up",
            cameraMovement: "slow push in",
            action: "She opens her eyes."
          })
        ]
      },
      hasUserSketch: false,
      panelAspectRatio: landscapeAspectRatio,
      stylePrompt: "",
      characterNames: ["HER"]
    });

    expect(prompt).toContain("2 empty landscape 16:9 panels");
    expect(prompt).toContain("The reference images show the characters: HER.");
    expect(prompt).toContain(
      "Panel 1 (Wide, static camera): The rooftop at dawn."
    );
    expect(prompt).toContain(
      "Panel 2 (Close-up, camera slow push in): She opens her eyes."
    );
  });
});
