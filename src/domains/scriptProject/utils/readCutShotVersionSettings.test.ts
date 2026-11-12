import { describe, expect, it } from "vitest";

import { readCutShotVersionSettings } from "./readCutShotVersionSettings";
import { SHOT_FPS } from "./snapShotFrames";

describe("readCutShotVersionSettings", () => {
  it("reads the Shot's own fields from the frozen render spec", () => {
    expect(
      readCutShotVersionSettings({
        render_spec: {
          kind: "shot",
          video_prompt: "The sergeant walks in.",
          dialogue: [{ speaker: "Sergeant", line: "Move out." }],
          settings: { duration_s: 6, engine: "seedance_2_5" },
          references: {
            characters: ["sergeant-v2"],
            environments: ["colony-v1"]
          }
        }
      })
    ).toEqual({
      videoPrompt: "The sergeant walks in.",
      dialogue: [{ speaker: "Sergeant", line: "Move out." }],
      durationSeconds: 6,
      referenceAssetIds: ["sergeant-v2", "colony-v1"]
    });
  });

  it("derives the duration from an inclusive frame range", () => {
    expect(
      readCutShotVersionSettings({
        render_spec: { settings: { frame_range: [0, SHOT_FPS * 4 - 1] } }
      })?.durationSeconds
    ).toBe(4);
  });

  it("falls back to the input settings when no render spec was recorded", () => {
    expect(
      readCutShotVersionSettings({
        render_spec: null,
        input_settings: { video_prompt: "Older version." }
      })?.videoPrompt
    ).toBe("Older version.");
  });

  it("returns null when the version recorded nothing", () => {
    expect(
      readCutShotVersionSettings({ render_spec: null, input_settings: null })
    ).toBeNull();
  });
});
