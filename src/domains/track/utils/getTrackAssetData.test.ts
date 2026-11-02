import { Layer } from "@schemas/layer";
import { createLayer } from "@tests/factories/layer";
import { describe, expect, it } from "vitest";

import { getTrackAssetData } from "./getTrackAssetData";

describe("getTrackAssetData", () => {
  it("returns the first clip's asset data", () => {
    const layer = createLayer();

    expect(getTrackAssetData(layer)).toBe(layer.clips[0].asset.data);
  });

  it("returns undefined when track is undefined", () => {
    expect(getTrackAssetData(undefined)).toBeUndefined();
  });

  it("returns undefined when clips is empty", () => {
    const layer = createLayer({ clips: [] });

    expect(getTrackAssetData(layer as Layer)).toBeUndefined();
  });
});
