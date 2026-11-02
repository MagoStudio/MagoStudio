import { Layer } from "@schemas/layer";
import { createLayer } from "@tests/factories/layer";
import { describe, expect, it } from "vitest";

import { getTrackClip } from "./getTrackClip";

describe("getTrackClip", () => {
  it("returns the first clip of the track", () => {
    const layer = createLayer();

    expect(getTrackClip(layer)).toBe(layer.clips[0]);
  });

  it("returns undefined when track is undefined", () => {
    expect(getTrackClip(undefined)).toBeUndefined();
  });

  it("returns undefined when clips is empty", () => {
    const layer = createLayer({ clips: [] });

    expect(getTrackClip(layer as Layer)).toBeUndefined();
  });
});
