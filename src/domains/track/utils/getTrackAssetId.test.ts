import { Layer } from "@schemas/layer";
import { createLayer } from "@tests/factories/layer";
import { describe, expect, it } from "vitest";

import { getTrackAssetId } from "./getTrackAssetId";

describe("getTrackAssetId", () => {
  it("returns the first clip's asset id", () => {
    const layer = createLayer();

    expect(getTrackAssetId(layer)).toBe(layer.clips[0].asset_id);
  });

  it("returns undefined when track is undefined", () => {
    expect(getTrackAssetId(undefined)).toBeUndefined();
  });

  it("returns undefined when clips is empty", () => {
    const layer = createLayer({ clips: [] });

    expect(getTrackAssetId(layer as Layer)).toBeUndefined();
  });
});
