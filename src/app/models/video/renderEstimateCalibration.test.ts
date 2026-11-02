import { VideoSettings } from "@models/video/types";
import { describe, expect, it } from "vitest";

import {
  calcMagoV1_0_0UpscalerRenderTimeSeconds,
  magoV1_0_0upscalerRenderModel
} from "./magoV1_0_0upscalerRenderModel";
import {
  calcMagoV2_0_0EsrganRenderTimeSeconds,
  magoV2_0_0EsrganUpscalerRenderModel
} from "./magoV2_0_0EsrganUpscalerRenderModel";
import {
  calcMagoV3_2_0RenderTimeSeconds,
  magoV3_2_0RenderModel
} from "./magoV3_2_0VideoModel";
import {
  calcMagoV3_3_0CnetsRenderTimeSeconds,
  magoV3_3_0_cnetsRenderModel
} from "./magoV3_3_0_cnetsVideoModel";
import {
  calcMagoV3_3_0RenderTimeSeconds,
  magoV3_3_0RenderModel
} from "./magoV3_3_0VideoModel";
import {
  calcMagoV3_4_0RenderTimeSeconds,
  magoV3_4_0RenderModel
} from "./magoV3_4_0VideoModel";
import {
  calcMagoV4_0_0RenderTimeSeconds,
  magoV4_0_0RenderModel
} from "./magoV4_0_0VideoModel";
import {
  calcMagoV4_1_0RenderTimeSeconds,
  magoV4_1_0RenderModel
} from "./magoV4_1_0VideoModel";
import {
  calcMagoV5_0_0RenderTimeSeconds,
  magoV5_0_0RenderModel
} from "./magoV5_0_0VideoModel";
import {
  calcMagoV7_0_0RenderTimeSeconds,
  magoV7_0_0RenderModel
} from "./magoV7_0_0VideoModel";
import {
  calcMagoV8_0_0RenderTimeSeconds,
  magoV8_0_0RenderModel
} from "./magoV8_0_0VideoModel";
import {
  calcMagoV9RenderTimeSeconds,
  minimaxReferenceVideoModel
} from "./minimaxReferenceVideoModel";
import {
  calcMagoV1_0_0MaskRenderTimeSeconds,
  v1_0_0_maskRenderModel
} from "./v1_0_0_maskVideoModel";
import {
  calcMagoV5_1_0RenderTimeSeconds,
  v5_1_0InpaintingRenderModel
} from "./v5_1_0InpaintingVideoModel";

const FRAME_COUNT = 100;

const creditsFor = (
  model: {
    calcEstimatedRenderTime?: (
      s: VideoSettings,
      f: number
    ) => { impactToShow: number };
  },
  settings: VideoSettings
): number => model.calcEstimatedRenderTime!(settings, FRAME_COUNT).impactToShow;

const secondsFor = (
  calcRenderTimeSeconds: (s: VideoSettings, f: number) => number,
  settings: VideoSettings
): number => Math.round(calcRenderTimeSeconds(settings, FRAME_COUNT));

const TRANSFORM_SETTINGS = { max_size: 1280, steps: 4 } as VideoSettings;
const CHARACTER_SETTINGS = {
  max_size: 1280,
  steps: 5,
  keep_background: false
} as VideoSettings;
const CHARACTER_WITH_BACKGROUND_SETTINGS = {
  max_size: 1280,
  steps: 5
} as VideoSettings;
const STYLE_TRANSFER_1280_SETTINGS = {
  max_size: 1280,
  steps: 4
} as VideoSettings;
const STYLE_TRANSFER_1920_SETTINGS = {
  max_size: 1920,
  steps: 4
} as VideoSettings;
const INPAINTING_SETTINGS = {
  max_size: 1280,
  total_steps: 6
} as VideoSettings;
const UPSCALER_10_STEPS_SETTINGS = {
  max_size: 1920,
  steps: 10,
  denoise: 0.2,
  tile_width_count: 2,
  tile_height_count: 2
} as VideoSettings;
const UPSCALER_6_STEPS_SETTINGS = {
  max_size: 1920,
  steps: 6,
  denoise: 0.4,
  tile_width_count: 2,
  tile_height_count: 2
} as VideoSettings;
const MASK_1080P_SETTINGS = {
  width: 1920,
  height: 1080,
  max_detected_objects: -1
} as VideoSettings;
const MASK_4K_SETTINGS = {
  width: 3840,
  height: 2160,
  max_detected_objects: -1
} as VideoSettings;
const ESRGAN_SETTINGS = {
  width: 1920,
  height: 1080,
  upscale_scale_factor: 2
} as VideoSettings;
const LTX_SETTINGS = { max_size: 1280 } as VideoSettings;

const MINIMAX_REFERENCE_SETTINGS = { max_size: 1280 } as VideoSettings;

describe("render estimate calibration anchors", () => {
  describe("credits quoted to the user match the backend fit", () => {
    it("Mago Transform v3.4.0 at 1280, 4 steps", () => {
      expect(creditsFor(magoV3_4_0RenderModel, TRANSFORM_SETTINGS)).toBe(322);
    });

    it("Mago v3.2.0 at 1280, 4 steps is undiscounted", () => {
      expect(creditsFor(magoV3_2_0RenderModel, TRANSFORM_SETTINGS)).toBe(459);
    });

    it("Mago v3.3.0 at 1280, 4 steps is undiscounted", () => {
      expect(creditsFor(magoV3_3_0RenderModel, TRANSFORM_SETTINGS)).toBe(459);
    });

    it("Mago v3.3.0.cnets at 1280, 4 steps is undiscounted", () => {
      expect(creditsFor(magoV3_3_0_cnetsRenderModel, TRANSFORM_SETTINGS)).toBe(
        459
      );
    });

    it("Mago character v4.0.0 at 1280, 5 steps", () => {
      expect(creditsFor(magoV4_0_0RenderModel, CHARACTER_SETTINGS)).toBe(413);
    });

    it("Mago character v4.1.0 at 1280, 5 steps", () => {
      expect(
        creditsFor(magoV4_1_0RenderModel, CHARACTER_WITH_BACKGROUND_SETTINGS)
      ).toBe(410);
    });

    it("Mago character v4.0.0 with keep_background quotes the v4.1.0 fit", () => {
      expect(
        creditsFor(magoV4_0_0RenderModel, {
          ...CHARACTER_WITH_BACKGROUND_SETTINGS,
          keep_background: true
        } as VideoSettings)
      ).toBe(410);
    });

    it("Style transfer v5.0.0 at 1280, 4 steps", () => {
      expect(
        creditsFor(magoV5_0_0RenderModel, STYLE_TRANSFER_1280_SETTINGS)
      ).toBe(281);
    });

    it("Style transfer v5.0.0 at 1920, 4 steps", () => {
      expect(
        creditsFor(magoV5_0_0RenderModel, STYLE_TRANSFER_1920_SETTINGS)
      ).toBe(765);
    });

    it("LTX HDR v7.0.0 at 1280 (real formula, no longer a flat 1cr placeholder)", () => {
      expect(creditsFor(magoV7_0_0RenderModel, LTX_SETTINGS)).toBe(267);
    });

    it("LTX clean-plate v8.0.0 at 1280 (shares the v7.0.0 fit)", () => {
      expect(creditsFor(magoV8_0_0RenderModel, LTX_SETTINGS)).toBe(267);
    });

    it("Mago Inpaint v5.1.0 at 1280, 6 total steps", () => {
      expect(creditsFor(v5_1_0InpaintingRenderModel, INPAINTING_SETTINGS)).toBe(
        330
      );
    });

    it("Creative upscaler v1.0_upscaler at 1920, 10 steps, 2x2 tiles", () => {
      expect(
        creditsFor(magoV1_0_0upscalerRenderModel, UPSCALER_10_STEPS_SETTINGS)
      ).toBe(620);
    });

    it("Creative upscaler v1.0_upscaler at 1920, 6 steps, 2x2 tiles", () => {
      expect(
        creditsFor(magoV1_0_0upscalerRenderModel, UPSCALER_6_STEPS_SETTINGS)
      ).toBe(470);
    });

    it("Mask v1.0.0.mask at 1920x1080", () => {
      expect(creditsFor(v1_0_0_maskRenderModel, MASK_1080P_SETTINGS)).toBe(83);
    });

    it("Mask v1.0.0.mask at 3840x2160", () => {
      expect(creditsFor(v1_0_0_maskRenderModel, MASK_4K_SETTINGS)).toBe(200);
    });

    it("Upscaler v2.0.0_esrgan_upscaler at 2x, 1920x1080", () => {
      expect(
        creditsFor(magoV2_0_0EsrganUpscalerRenderModel, ESRGAN_SETTINGS)
      ).toBe(681);
    });

    it("MiniMax Reference v9.1.0 at 1280, frame range snapped onto the v9 grid", () => {
      expect(
        creditsFor(minimaxReferenceVideoModel, MINIMAX_REFERENCE_SETTINGS)
      ).toBe(312);
    });
  });

  describe("render time in seconds matches the backend fit", () => {
    it("v9.0.0 / v9.1.0 2000 / frame_range [0, 56]", () => {
      expect(
        calcMagoV9RenderTimeSeconds({
          longEdgePx: 2000,
          requestedFrameCount: 56
        })
      ).toBeCloseTo(605.12, 2);
    });

    it("v3.4.0 1280 / 4 steps", () => {
      expect(
        secondsFor(calcMagoV3_4_0RenderTimeSeconds, TRANSFORM_SETTINGS)
      ).toBe(459);
    });

    it("v4.0.0 1280 / 5 steps", () => {
      expect(
        secondsFor(calcMagoV4_0_0RenderTimeSeconds, CHARACTER_SETTINGS)
      ).toBe(589);
    });

    it("v4.1.0 1280 / 5 steps", () => {
      expect(
        secondsFor(
          calcMagoV4_1_0RenderTimeSeconds,
          CHARACTER_WITH_BACKGROUND_SETTINGS
        )
      ).toBe(585);
    });

    it("v5.0.0 1280 / 4 steps", () => {
      expect(
        secondsFor(
          calcMagoV5_0_0RenderTimeSeconds,
          STYLE_TRANSFER_1280_SETTINGS
        )
      ).toBe(400);
    });

    it("v5.0.0 1920 / 4 steps", () => {
      expect(
        secondsFor(
          calcMagoV5_0_0RenderTimeSeconds,
          STYLE_TRANSFER_1920_SETTINGS
        )
      ).toBe(1092);
    });

    it("v7.0.0 / v8.0.0 1280 (shared LTX fit)", () => {
      expect(secondsFor(calcMagoV7_0_0RenderTimeSeconds, LTX_SETTINGS)).toBe(
        267
      );
      expect(secondsFor(calcMagoV8_0_0RenderTimeSeconds, LTX_SETTINGS)).toBe(
        267
      );
    });

    it("v5.1.0 1280 / 6 total steps", () => {
      expect(
        secondsFor(calcMagoV5_1_0RenderTimeSeconds, INPAINTING_SETTINGS)
      ).toBe(471);
    });

    it("v1.0_upscaler 1920 / 10 steps / 2x2 tiles", () => {
      expect(
        secondsFor(
          calcMagoV1_0_0UpscalerRenderTimeSeconds,
          UPSCALER_10_STEPS_SETTINGS
        )
      ).toBe(886);
    });

    it("v1.0_upscaler 1920 / 6 steps / 2x2 tiles", () => {
      expect(
        secondsFor(
          calcMagoV1_0_0UpscalerRenderTimeSeconds,
          UPSCALER_6_STEPS_SETTINGS
        )
      ).toBe(671);
    });

    it("v1.0.0.mask 1920x1080", () => {
      expect(
        secondsFor(calcMagoV1_0_0MaskRenderTimeSeconds, MASK_1080P_SETTINGS)
      ).toBe(118);
    });

    it("v1.0.0.mask 3840x2160", () => {
      expect(
        secondsFor(calcMagoV1_0_0MaskRenderTimeSeconds, MASK_4K_SETTINGS)
      ).toBe(285);
    });

    it("v2.0.0_esrgan_upscaler 2x 1920x1080", () => {
      expect(
        secondsFor(calcMagoV2_0_0EsrganRenderTimeSeconds, ESRGAN_SETTINGS)
      ).toBe(973);
    });
  });

  describe("the four transform engines keep identical copies of one fit", () => {
    const TRANSFORM_TIME_FUNCTIONS = [
      calcMagoV3_2_0RenderTimeSeconds,
      calcMagoV3_3_0RenderTimeSeconds,
      calcMagoV3_3_0CnetsRenderTimeSeconds,
      calcMagoV3_4_0RenderTimeSeconds
    ];

    const DRIFT_PROBES: ReadonlyArray<VideoSettings> = [
      { max_size: 1280, steps: 4 } as VideoSettings,
      { max_size: 1620, steps: 7, enable_interpolation: true } as VideoSettings,
      { max_size: 512, steps: 1, control_type: "pose_depth" } as VideoSettings,
      {
        max_size: 1024,
        steps: 12,
        enable_facemesh_blending: true
      } as VideoSettings
    ];

    it.each(DRIFT_PROBES)("agrees on %o", (settings) => {
      const allSeconds = TRANSFORM_TIME_FUNCTIONS.map((calcSeconds) =>
        calcSeconds(settings, FRAME_COUNT)
      );

      expect(new Set(allSeconds).size).toBe(1);
    });
  });

  describe("documented behaviour of the refitted formulas", () => {
    it("Creative upscaler no longer prices on denoise", () => {
      const lowDenoise = creditsFor(magoV1_0_0upscalerRenderModel, {
        max_size: 1920,
        steps: 8,
        denoise: 0.1,
        tile_width_count: 2,
        tile_height_count: 2
      } as VideoSettings);
      const highDenoise = creditsFor(magoV1_0_0upscalerRenderModel, {
        max_size: 1920,
        steps: 8,
        denoise: 0.9,
        tile_width_count: 2,
        tile_height_count: 2
      } as VideoSettings);

      expect(lowDenoise).toBe(highDenoise);
    });

    it("Creative upscaler fastmode discounts the per-frame work but not startup", () => {
      const normal = calcMagoV1_0_0UpscalerRenderTimeSeconds(
        UPSCALER_10_STEPS_SETTINGS,
        FRAME_COUNT
      );
      const fastmode = calcMagoV1_0_0UpscalerRenderTimeSeconds(
        { ...UPSCALER_10_STEPS_SETTINGS, enable_interpolation: true },
        FRAME_COUNT
      );

      expect(fastmode).toBeCloseTo((normal - 350) * 0.7 + 350, 6);
    });

    it("Transform applies the control overhead before the fixed offset", () => {
      const plain = calcMagoV3_4_0RenderTimeSeconds(
        TRANSFORM_SETTINGS,
        FRAME_COUNT
      );
      const withPoseDepth = calcMagoV3_4_0RenderTimeSeconds(
        { ...TRANSFORM_SETTINGS, control_type: "pose_depth" },
        FRAME_COUNT
      );

      expect(withPoseDepth).toBeCloseTo((plain - 40) * 1.2 + 40, 6);
    });

    it("mask cost rises faster than linearly with resolution", () => {
      const hd = calcMagoV1_0_0MaskRenderTimeSeconds(
        MASK_1080P_SETTINGS,
        FRAME_COUNT
      );
      const uhd = calcMagoV1_0_0MaskRenderTimeSeconds(
        MASK_4K_SETTINGS,
        FRAME_COUNT
      );

      expect((uhd - 20) / (hd - 20)).toBeCloseTo(Math.pow(4, 0.720236), 4);
    });

    it("mask object count has no effect while its coefficient is zero", () => {
      const oneObject = creditsFor(v1_0_0_maskRenderModel, {
        ...MASK_1080P_SETTINGS,
        max_detected_objects: 1
      } as VideoSettings);
      const manyObjects = creditsFor(v1_0_0_maskRenderModel, {
        ...MASK_1080P_SETTINGS,
        max_detected_objects: 9
      } as VideoSettings);

      expect(oneObject).toBe(manyObjects);
    });

    it("a setting that is not a positive number falls back instead of poisoning the quote", () => {
      const credits = creditsFor(magoV3_4_0RenderModel, {
        max_size: [1920, 1080],
        steps: 4
      } as unknown as VideoSettings);

      expect(Number.isFinite(credits)).toBe(true);
      expect(credits).toBe(Math.ceil(40 * 0.7));
    });
  });
});
