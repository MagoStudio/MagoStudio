import { describe, expect, it } from "vitest";

import { describeCutShotVersionRenderSettings } from "./describeCutShotVersionRenderSettings";

describe("describeCutShotVersionRenderSettings", () => {
  it("names the engine and the quality the version was rendered at", () => {
    expect(
      describeCutShotVersionRenderSettings({
        render_spec: {
          settings: { engine: "seedance_2_5" },
          output_size: [1280, 720]
        }
      })
    ).toEqual({
      engineLabelKey: "script_project.shot_render_seedance_2_5.label",
      qualityLabel: "720p"
    });
  });

  it("reads quality from the short side of a portrait output", () => {
    expect(
      describeCutShotVersionRenderSettings({
        render_spec: { output_size: [1080, 1920] }
      }).qualityLabel
    ).toBe("1080p");
  });

  it("leaves out an engine it has no name for", () => {
    expect(
      describeCutShotVersionRenderSettings({
        render_spec: { settings: { engine: "unknown_engine" } }
      }).engineLabelKey
    ).toBeUndefined();
  });

  it("describes nothing when the version has no render spec", () => {
    expect(describeCutShotVersionRenderSettings({ render_spec: null })).toEqual(
      {
        engineLabelKey: undefined,
        qualityLabel: undefined
      }
    );
  });
});
