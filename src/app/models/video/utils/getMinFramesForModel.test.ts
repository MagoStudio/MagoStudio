import { VideoModelDefinition } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { getMinFramesForModel } from "./getMinFramesForModel";

const buildModel = (
  modelLimits: VideoModelDefinition["renderDurationLimits"]["modelLimits"]
): VideoModelDefinition =>
  ({
    renderDurationLimits: { modelLimits }
  }) as VideoModelDefinition;

describe("getMinFramesForModel", () => {
  it("returns minFrames directly for a frame-based model", () => {
    const model = buildModel({ minFrames: 12, maxFrames: 240 });

    expect(getMinFramesForModel(model, 24)).toBe(12);
  });

  it("converts minSeconds to frames using the given fps for a time-based model", () => {
    const model = buildModel({ minSeconds: 2, maxSeconds: 10 });

    expect(getMinFramesForModel(model, 24)).toBe(48);
  });

  it("rounds a fractional frame count up", () => {
    const model = buildModel({ minSeconds: 1, maxSeconds: 10 });

    expect(getMinFramesForModel(model, 25)).toBe(25);
    expect(getMinFramesForModel(model, 24.5)).toBe(25);
  });
});
