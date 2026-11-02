import { AssetStatus } from "@schemas/asset";
import { Layer } from "@schemas/layer";
import { createLayer } from "@tests/factories/layer";
import { describe, expect, it } from "vitest";

import { isTrackAssetFinished } from "./isTrackAssetFinished";

describe("isTrackAssetFinished", () => {
  it("returns true when the asset's queue_status is FINISHED", () => {
    const layer = createLayer();
    layer.clips[0].asset.data.queue_status = AssetStatus.FINISHED;

    expect(isTrackAssetFinished(layer)).toBe(true);
  });

  it("returns false for any other queue_status", () => {
    const layer = createLayer();
    layer.clips[0].asset.data.queue_status = AssetStatus.INPROGRESS;

    expect(isTrackAssetFinished(layer)).toBe(false);
  });

  it("returns false when queue_status is absent", () => {
    const layer = createLayer();
    layer.clips[0].asset.data.queue_status = undefined;

    expect(isTrackAssetFinished(layer)).toBe(false);
  });

  it("returns false when track is undefined", () => {
    expect(isTrackAssetFinished(undefined)).toBe(false);
  });

  it("returns false when clips is empty", () => {
    const layer = createLayer({ clips: [] });

    expect(isTrackAssetFinished(layer as Layer)).toBe(false);
  });
});
