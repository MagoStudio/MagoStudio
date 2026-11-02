import { Layer } from "@schemas/layer";
import { createLayer } from "@tests/factories/layer";
import { describe, expect, it } from "vitest";

import { getTrackSources } from "./getTrackSources";

describe("getTrackSources", () => {
  it("returns the sources object from clips[0].asset.data.data.sources", () => {
    const layer = createLayer();
    layer.clips[0].asset.data.data = {
      render_settings: { magov2: { mago_engine: "v3.4.0" } },
      sources: {
        images: [{ asset_id: "ref-1", type: "reference_frame" }]
      }
    };

    expect(getTrackSources(layer)).toEqual({
      images: [{ asset_id: "ref-1", type: "reference_frame" }]
    });
  });

  it("returns undefined when the asset path is empty even if clip.data.sources is populated", () => {
    const layer = createLayer();
    layer.clips[0].asset.data.data = undefined;
    layer.clips[0].data = {
      ...layer.clips[0].data,
      sources: { video: "input-track-id" }
    };

    expect(getTrackSources(layer)).toBeUndefined();
  });

  it("returns undefined when track is undefined", () => {
    expect(getTrackSources(undefined)).toBeUndefined();
  });

  it("returns undefined when clips is empty", () => {
    const layer = createLayer({ clips: [] });

    expect(getTrackSources(layer as Layer)).toBeUndefined();
  });
});
