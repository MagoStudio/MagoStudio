import { SourceImage } from "@domains/renders/types";
import {
  PrepareRenderSettingsContext,
  VideoSettings
} from "@models/video/types";
import { describe, expect, it } from "vitest";

import { happyHorse1Model } from "./happyHorse1Model";
import { kling2_6MotionControlModel } from "./kling2_6MotionControlModel";
import { kling3_0MotionControlModel } from "./kling3_0MotionControlModel";
import { klingO1Model } from "./klingO1Model";
import { klingO3EditProModel } from "./klingO3EditProModel";
import { seedance2Model } from "./seedance2Model";

const context = (
  sources: SourceImage[] = []
): PrepareRenderSettingsContext => ({
  frameRange: [0, 24],
  fps: 24,
  sources
});

const run = (
  model: {
    formatSourcesForBackend?: (
      s: VideoSettings,
      c: PrepareRenderSettingsContext
    ) => SourceImage[];
  },
  sources: SourceImage[]
) => model.formatSourcesForBackend!({} as VideoSettings, context(sources));

describe("external model formatSourcesForBackend passes context.sources through unchanged", () => {
  it("Kling O1: reference_frame + element roles pass through", () => {
    const sources: SourceImage[] = [
      { asset_id: "a", type: "reference_frame" },
      { asset_id: "b", type: "reference_frame" },
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ];
    expect(run(klingO1Model, sources)).toBe(sources);
  });

  it("Kling O3 Edit Pro: same identity behavior as O1", () => {
    const sources: SourceImage[] = [{ asset_id: "a", type: "reference_frame" }];
    expect(run(klingO3EditProModel, sources)).toBe(sources);
  });

  it("Seedance 2.0: reference_frame entries pass through", () => {
    const sources: SourceImage[] = [
      { asset_id: "s1", type: "reference_frame" },
      { asset_id: "s2", type: "reference_frame" }
    ];
    expect(run(seedance2Model, sources)).toBe(sources);
  });

  it("Happy Horse 1.0: reference_frame entries pass through", () => {
    const sources: SourceImage[] = [
      { asset_id: "h1", type: "reference_frame" }
    ];
    expect(run(happyHorse1Model, sources)).toBe(sources);
  });

  it("Kling 2.6 Motion Control: motion_reference passes through", () => {
    const sources: SourceImage[] = [
      { asset_id: "m", type: "motion_reference" }
    ];
    expect(run(kling2_6MotionControlModel, sources)).toBe(sources);
  });

  it("Kling 3.0 Motion Control: motion_reference + element roles pass through", () => {
    const sources: SourceImage[] = [
      { asset_id: "m", type: "motion_reference" },
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ];
    expect(run(kling3_0MotionControlModel, sources)).toBe(sources);
  });

  it("returns an empty array when the model has no sources selected", () => {
    expect(run(seedance2Model, [])).toEqual([]);
    expect(run(kling2_6MotionControlModel, [])).toEqual([]);
    expect(run(klingO1Model, [])).toEqual([]);
  });
});
