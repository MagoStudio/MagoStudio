import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { estimateBulkRendersRunRemainingCredits } from "./estimateBulkRendersRunRemainingCredits";

const ENGINES_WITH_NO_BULK_RENDERING_PRICE = [
  VideoEngine.V2_5_0,
  VideoEngine.V3_1_0,
  VideoEngine.wan_animate_2_2,
  VideoEngine.wan_vace_2_1,
  VideoEngine.mago_style_transfer_local,
  VideoEngine.mago_animate,
  VideoEngine.ltx_2_3_spatial_upscaler,
  VideoEngine.minimax_h3_local
].sort();

describe("estimateBulkRendersRunRemainingCredits", () => {
  it("prices an fps-based video engine and a table-priced image model together", () => {
    const result = estimateBulkRendersRunRemainingCredits({
      videoSettings: {
        engine: VideoEngine.happy_horse_1,
        frame_range: [0, 48],
        fps: 24,
        resolution: "720p"
      },
      imageSettings: {
        render_model: "gpt_image_2",
        quality: "high"
      },
      shotOverridesById: undefined,
      shotIdsOwingImageRender: ["shot-1"],
      shotIdsOwingVideoRender: ["shot-1"]
    });

    expect(result).toEqual({
      estimatedRemainingCredits: 190 + 560,
      couldNotBePriced: false
    });
  });

  it("prices a flat per-model image cost with no quality or resolution setting", () => {
    const result = estimateBulkRendersRunRemainingCredits({
      videoSettings: undefined,
      imageSettings: { render_model: "nanobanana_pro" },
      shotOverridesById: undefined,
      shotIdsOwingImageRender: ["shot-1", "shot-2"],
      shotIdsOwingVideoRender: []
    });

    expect(result).toEqual({
      estimatedRemainingCredits: 170 * 2,
      couldNotBePriced: false
    });
  });

  it("cannot price a Mago-family engine whose settings do not echo max_size", () => {
    const result = estimateBulkRendersRunRemainingCredits({
      videoSettings: {
        engine: VideoEngine.V4_0_0,
        frame_range: [0, 48]
      },
      imageSettings: undefined,
      shotOverridesById: undefined,
      shotIdsOwingImageRender: [],
      shotIdsOwingVideoRender: ["shot-1"]
    });

    expect(result).toEqual({
      estimatedRemainingCredits: 0,
      couldNotBePriced: true
    });
  });

  it("cannot price MiniMax Reference when its settings do not echo max_size", () => {
    const result = estimateBulkRendersRunRemainingCredits({
      videoSettings: {
        engine: VideoEngine.minimax_reference,
        frame_range: [0, 56]
      },
      imageSettings: undefined,
      shotOverridesById: undefined,
      shotIdsOwingImageRender: [],
      shotIdsOwingVideoRender: ["shot-1"]
    });

    expect(result).toEqual({
      estimatedRemainingCredits: 0,
      couldNotBePriced: true
    });
  });

  it("cannot price an image render model the credit table does not recognise", () => {
    const result = estimateBulkRendersRunRemainingCredits({
      videoSettings: undefined,
      imageSettings: { render_model: "some_future_image_model" },
      shotOverridesById: undefined,
      shotIdsOwingImageRender: ["shot-1"],
      shotIdsOwingVideoRender: []
    });

    expect(result).toEqual({
      estimatedRemainingCredits: 0,
      couldNotBePriced: true
    });
  });

  it("does not require video settings when no Shot owes a video render", () => {
    const result = estimateBulkRendersRunRemainingCredits({
      videoSettings: undefined,
      imageSettings: { render_model: "qwen" },
      shotOverridesById: undefined,
      shotIdsOwingImageRender: ["shot-1"],
      shotIdsOwingVideoRender: []
    });

    expect(result).toEqual({
      estimatedRemainingCredits: 77,
      couldNotBePriced: false
    });
  });

  it("returns zero credits with nothing to price when no Shot owes any render", () => {
    const result = estimateBulkRendersRunRemainingCredits({
      videoSettings: undefined,
      imageSettings: undefined,
      shotOverridesById: undefined,
      shotIdsOwingImageRender: [],
      shotIdsOwingVideoRender: []
    });

    expect(result).toEqual({
      estimatedRemainingCredits: 0,
      couldNotBePriced: false
    });
  });

  it("prices every video engine the app can select, or names it as unpriceable on purpose", () => {
    const unpriceableEngines = Object.values(VideoEngine).filter((engine) => {
      const result = estimateBulkRendersRunRemainingCredits({
        videoSettings: {
          engine,
          frame_range: [0, 48],
          max_size: 720,
          fps: 24,
          resolution: "720p",
          quality: "high"
        },
        imageSettings: undefined,
        shotOverridesById: undefined,
        shotIdsOwingImageRender: [],
        shotIdsOwingVideoRender: ["shot-1"]
      });

      if (!result.couldNotBePriced) {
        expect(result.estimatedRemainingCredits).toBeGreaterThan(0);
      }

      return result.couldNotBePriced;
    });

    expect(unpriceableEngines.sort()).toEqual(
      ENGINES_WITH_NO_BULK_RENDERING_PRICE
    );
  });

  it("prices a Shot overridden to a different, pricier video engine at its own rate, not the master's", () => {
    const masterOnlyResult = estimateBulkRendersRunRemainingCredits({
      videoSettings: {
        engine: VideoEngine.happy_horse_1,
        frame_range: [0, 48],
        fps: 24,
        resolution: "720p"
      },
      imageSettings: undefined,
      shotOverridesById: undefined,
      shotIdsOwingImageRender: [],
      shotIdsOwingVideoRender: ["shot-1", "shot-2"]
    });

    const withOverrideResult = estimateBulkRendersRunRemainingCredits({
      videoSettings: {
        engine: VideoEngine.happy_horse_1,
        frame_range: [0, 48],
        fps: 24,
        resolution: "720p"
      },
      imageSettings: undefined,
      shotOverridesById: {
        "shot-2": {
          video_settings: {
            engine: VideoEngine.seedance_2,
            resolution: "1080p"
          }
        }
      },
      shotIdsOwingImageRender: [],
      shotIdsOwingVideoRender: ["shot-1", "shot-2"]
    });

    expect(withOverrideResult.couldNotBePriced).toBe(false);
    expect(withOverrideResult.estimatedRemainingCredits).not.toBe(
      masterOnlyResult.estimatedRemainingCredits
    );

    const masterOnlyPerShot = masterOnlyResult.estimatedRemainingCredits / 2;
    expect(withOverrideResult.estimatedRemainingCredits).not.toBe(
      masterOnlyPerShot * 2
    );
  });

  it("prices a Shot overridden to a different image render model at its own rate, not the master's", () => {
    const result = estimateBulkRendersRunRemainingCredits({
      videoSettings: undefined,
      imageSettings: { render_model: "nanobanana_pro" },
      shotOverridesById: {
        "shot-2": {
          img2img_settings: { render_model: "qwen" }
        }
      },
      shotIdsOwingImageRender: ["shot-1", "shot-2"],
      shotIdsOwingVideoRender: []
    });

    expect(result).toEqual({
      estimatedRemainingCredits: 170 + 77,
      couldNotBePriced: false
    });
  });

  it("cannot price the run when an overridden Shot's own settings do not resolve, even if the master would", () => {
    const result = estimateBulkRendersRunRemainingCredits({
      videoSettings: {
        engine: VideoEngine.happy_horse_1,
        frame_range: [0, 48],
        fps: 24,
        resolution: "720p"
      },
      imageSettings: undefined,
      shotOverridesById: {
        "shot-1": {
          video_settings: { engine: VideoEngine.V4_0_0 }
        }
      },
      shotIdsOwingImageRender: [],
      shotIdsOwingVideoRender: ["shot-1"]
    });

    expect(result).toEqual({
      estimatedRemainingCredits: 0,
      couldNotBePriced: true
    });
  });
});
