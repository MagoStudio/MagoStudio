import { Layer } from "@schemas/layer";
import { createLayer } from "@tests/factories/layer";
import { describe, expect, it } from "vitest";

import { getTrackRenderSettings } from "./getTrackRenderSettings";

describe("getTrackRenderSettings", () => {
  it("returns the magov2 dict from clips[0].asset.data.data.render_settings.magov2", () => {
    const layer = createLayer();
    layer.clips[0].asset.data.data = {
      render_settings: { magov2: { mago_engine: "v3.4.0", cfg: 1 } }
    };

    expect(getTrackRenderSettings(layer)).toEqual({
      mago_engine: "v3.4.0",
      cfg: 1
    });
  });

  it("returns undefined when the asset path is empty even if clip/layer copies are populated", () => {
    const layer = createLayer({
      data: {
        renderSettings: { magov2: { mago_engine: "v_layer_stale" } },
        renderEngine: "magov2"
      }
    });
    layer.clips[0].asset.data.data = undefined;
    layer.clips[0].data = {
      ...layer.clips[0].data,
      render_settings: { magov2: { mago_engine: "v_clip_stale" } }
    } as (typeof layer.clips)[0]["data"];

    expect(getTrackRenderSettings(layer)).toBeUndefined();
  });

  it("returns undefined when track is undefined", () => {
    expect(getTrackRenderSettings(undefined)).toBeUndefined();
  });

  it("returns undefined when clips is empty", () => {
    const layer = createLayer({ clips: [] });

    expect(getTrackRenderSettings(layer as Layer)).toBeUndefined();
  });
});
