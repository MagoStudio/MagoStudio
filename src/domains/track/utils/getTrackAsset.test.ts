import { Clip } from "@schemas/clip";
import { Layer } from "@schemas/layer";
import { createLayer } from "@tests/factories/layer";
import { describe, expect, it } from "vitest";

import { getTrackAsset } from "./getTrackAsset";

describe("getTrackAsset", () => {
  it("returns the first clip's asset", () => {
    const layer = createLayer();

    expect(getTrackAsset(layer)).toBe(layer.clips[0].asset);
  });

  it("returns undefined when track is undefined", () => {
    expect(getTrackAsset(undefined)).toBeUndefined();
  });

  it("returns undefined when clips is empty", () => {
    const layer = createLayer({ clips: [] });

    expect(getTrackAsset(layer as Layer)).toBeUndefined();
  });

  it("returns undefined when the clip has no asset", () => {
    const layer = createLayer();
    layer.clips = [{ ...layer.clips[0], asset: undefined } as unknown as Clip];

    expect(getTrackAsset(layer)).toBeUndefined();
  });
});
