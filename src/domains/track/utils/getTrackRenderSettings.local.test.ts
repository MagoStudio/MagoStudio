import { createLayer } from "@tests/factories/layer";
import { describe, expect, it } from "vitest";

import { getTrackRenderSettings } from "./getTrackRenderSettings.local";

describe("getTrackRenderSettings (desktop)", () => {
  it("prefers the canonical asset settings", () => {
    const layer = createLayer();
    layer.clips[0].asset.data.data = {
      render_settings: { magov2: { mago_engine: "asset-model" } }
    };
    layer.clips[0].data.settings = { mago_engine: "clip-model" };

    expect(getTrackRenderSettings(layer)?.mago_engine).toBe("asset-model");
  });

  it("falls back to settings retained by a desktop cloud clip", () => {
    const layer = createLayer();
    layer.clips[0].asset.data.data = undefined;
    layer.clips[0].data.settings = {
      mago_engine: "v8.0.0",
      prompt: "clean plate"
    };

    expect(getTrackRenderSettings(layer)).toMatchObject({
      mago_engine: "v8.0.0",
      prompt: "clean plate"
    });
  });
});
