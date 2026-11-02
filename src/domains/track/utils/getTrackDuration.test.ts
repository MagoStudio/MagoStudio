import { Layer } from "@schemas/layer";
import { createLayer } from "@tests/factories/layer";
import { describe, expect, it } from "vitest";

import { getTrackDuration } from "./getTrackDuration";

describe("getTrackDuration", () => {
  it("returns the asset's duration in frames", () => {
    const layer = createLayer();
    layer.clips[0].asset.data.duration = 120;

    expect(getTrackDuration(layer)).toBe(120);
  });

  it("returns undefined when the asset has no duration", () => {
    const layer = createLayer();
    layer.clips[0].asset.data.duration = undefined;

    expect(getTrackDuration(layer)).toBeUndefined();
  });

  it("returns undefined when track is undefined", () => {
    expect(getTrackDuration(undefined)).toBeUndefined();
  });

  it("returns undefined when clips is empty", () => {
    const layer = createLayer({ clips: [] });

    expect(getTrackDuration(layer as Layer)).toBeUndefined();
  });
});
