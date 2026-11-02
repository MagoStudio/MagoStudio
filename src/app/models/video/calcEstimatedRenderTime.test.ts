import { VideoSettings } from "@models/video/types";
import { describe, it, expect } from "vitest";

import { happyHorse1Model } from "./happyHorse1Model";
import { kling2_6MotionControlModel } from "./kling2_6MotionControlModel";
import { klingO1Model } from "./klingO1Model";
import { klingO3EditProModel } from "./klingO3EditProModel";
import { magoV1_0_0upscalerRenderModel } from "./magoV1_0_0upscalerRenderModel";
import { magoV2_0_0EsrganUpscalerRenderModel } from "./magoV2_0_0EsrganUpscalerRenderModel";
import { magoV2_5_0RenderModel } from "./magoV2_5_0VideoModel";
import { magoV3_1_0RenderModel } from "./magoV3_1_0VideoModel";
import { magoV3_2_0RenderModel } from "./magoV3_2_0VideoModel";
import { magoV3_3_0_cnetsRenderModel } from "./magoV3_3_0_cnetsVideoModel";
import { magoV3_3_0RenderModel } from "./magoV3_3_0VideoModel";
import { magoV3_4_0RenderModel } from "./magoV3_4_0VideoModel";
import { magoV4_0_0RenderModel } from "./magoV4_0_0VideoModel";
import { magoV4_1_0RenderModel } from "./magoV4_1_0VideoModel";
import { magoV5_0_0RenderModel } from "./magoV5_0_0VideoModel";
import { seedance2Model } from "./seedance2Model";
import { v1_0_0_maskRenderModel } from "./v1_0_0_maskVideoModel";
import { v5_1_0InpaintingRenderModel } from "./v5_1_0InpaintingVideoModel";

const calc = (
  model: {
    calcEstimatedRenderTime?: (
      s: VideoSettings,
      f: number
    ) => { impactToShow: number };
  },
  settings: VideoSettings,
  frames: number
) => model.calcEstimatedRenderTime!(settings, frames).impactToShow;

const discounted = (rawBeValue: number): number => Math.ceil(rawBeValue * 0.7);

describe("calcEstimatedRenderTime", () => {
  describe("SAM3 Mask (v1_0_0_maskRenderModel) — BE validation data", () => {
    it("1920x1080, 100 frames, obj=-1 → 117.604", () => {
      const result = calc(
        v1_0_0_maskRenderModel,
        {
          width: 1920,
          height: 1080,
          max_detected_objects: -1
        } as VideoSettings,
        100
      );
      expect(result).toBe(discounted(117.604));
    });

    it("1280x720, 200 frames, obj=3 → 128.854", () => {
      const result = calc(
        v1_0_0_maskRenderModel,
        {
          width: 1280,
          height: 720,
          max_detected_objects: 3
        } as VideoSettings,
        200
      );
      expect(result).toBe(discounted(128.854));
    });

    it("1920x1080, 50 frames, obj=1 → 68.802", () => {
      const result = calc(
        v1_0_0_maskRenderModel,
        {
          width: 1920,
          height: 1080,
          max_detected_objects: 1
        } as VideoSettings,
        50
      );
      expect(result).toBe(discounted(68.802));
    });

    it("1920x1080, 150 frames, obj=5 → 166.406", () => {
      const result = calc(
        v1_0_0_maskRenderModel,
        {
          width: 1920,
          height: 1080,
          max_detected_objects: 5
        } as VideoSettings,
        150
      );
      expect(result).toBe(discounted(166.406));
    });

    it("object count has no effect (obj_coeff=0)", () => {
      const settings1obj = {
        width: 1920,
        height: 1080,
        max_detected_objects: 1
      } as VideoSettings;
      const settings5obj = {
        width: 1920,
        height: 1080,
        max_detected_objects: -1
      } as VideoSettings;
      const result1 = calc(v1_0_0_maskRenderModel, settings1obj, 100);
      const result5 = calc(v1_0_0_maskRenderModel, settings5obj, 100);
      expect(result1).toBe(result5);
    });
  });

  describe("ESRGAN upscaler (magoV2_0_0EsrganUpscalerRenderModel) — BE validation data", () => {
    it("1920x1080, 100 frames, 2x scale → 248", () => {
      const result = calc(
        magoV2_0_0EsrganUpscalerRenderModel,
        {
          width: 1920,
          height: 1080,
          upscale_scale_factor: 2
        } as VideoSettings,
        100
      );
      expect(result).toBe(discounted(972.582));
    });

    it("1280x720, 50 frames, 4x scale → 221", () => {
      const result = calc(
        magoV2_0_0EsrganUpscalerRenderModel,
        {
          width: 1280,
          height: 720,
          upscale_scale_factor: 4
        } as VideoSettings,
        50
      );
      expect(result).toBe(discounted(873.406));
    });

    it("1920x1080, 200 frames, 2x scale → 485", () => {
      const result = calc(
        magoV2_0_0EsrganUpscalerRenderModel,
        {
          width: 1920,
          height: 1080,
          upscale_scale_factor: 2
        } as VideoSettings,
        200
      );
      expect(result).toBe(discounted(1865.164));
    });
  });

  describe("Kling O1 (klingO1Model)", () => {
    it("120 frames, 24fps", () => {
      const result = calc(klingO1Model, { fps: 24 } as VideoSettings, 120);
      expect(result).toBe(1290);
    });

    it("120 frames, 30fps", () => {
      const result = calc(klingO1Model, { fps: 30 } as VideoSettings, 120);
      expect(result).toBe(1032);
    });
  });

  describe("Kling 2.6 (kling2_6MotionControlModel)", () => {
    it("120 frames, 24fps", () => {
      const result = calc(
        kling2_6MotionControlModel,
        { fps: 24 } as VideoSettings,
        120
      );
      expect(result).toBe(860);
    });
  });

  describe("Kling O3 (klingO3EditProModel)", () => {
    it("120 frames, 24fps", () => {
      const result = calc(
        klingO3EditProModel,
        { fps: 24 } as VideoSettings,
        120
      );
      expect(result).toBe(1290);
    });
  });

  describe("Mago V3.2 (magoV3_2_0RenderModel)", () => {
    const baseSettings: VideoSettings = {
      max_size: 1024,
      steps: 20,
      enable_interpolation: false
    };

    it("baseline, 48 frames", () => {
      const result = calc(magoV3_2_0RenderModel, baseSettings, 48);
      expect(result).toBe(Math.ceil(420.099));
    });

    it("with interpolation, 48 frames", () => {
      const result = calc(
        magoV3_2_0RenderModel,
        { ...baseSettings, enable_interpolation: true },
        48
      );
      expect(result).toBe(Math.ceil(306.069));
    });
  });

  describe("Mago V3.3 cnets (magoV3_3_0_cnetsRenderModel)", () => {
    const baseSettings: VideoSettings = {
      max_size: 1024,
      steps: 20,
      enable_interpolation: false
    };

    it("baseline (no control)", () => {
      const result = calc(magoV3_3_0_cnetsRenderModel, baseSettings, 48);
      expect(result).toBe(Math.ceil(420.099));
    });

    it("with pose_depth control", () => {
      const result = calc(
        magoV3_3_0_cnetsRenderModel,
        { ...baseSettings, control_type: "pose_depth" },
        48
      );
      expect(result).toBe(Math.ceil(496.119));
    });

    it("with facemesh blending", () => {
      const result = calc(
        magoV3_3_0_cnetsRenderModel,
        { ...baseSettings, enable_facemesh_blending: true },
        48
      );
      expect(result).toBe(Math.ceil(496.119));
    });

    it("with pose_depth and facemesh", () => {
      const result = calc(
        magoV3_3_0_cnetsRenderModel,
        {
          ...baseSettings,
          control_type: "pose_depth",
          enable_facemesh_blending: true
        },
        48
      );
      expect(result).toBe(Math.ceil(572.139));
    });
  });

  describe("Mago Transform (magoV3_4_0RenderModel)", () => {
    it("baseline, 48 frames", () => {
      const result = calc(
        magoV3_4_0RenderModel,
        {
          max_size: 1024,
          steps: 20,
          enable_interpolation: false
        } as VideoSettings,
        48
      );
      expect(result).toBe(discounted(420.099));
    });
  });

  describe("Mago V4.0 (magoV4_0_0RenderModel) — BE validation data (2026-09-16 unpin)", () => {
    it("1280, 200 frames, 5 steps, no fastmode → 1240.156", () => {
      const result = calc(
        magoV4_0_0RenderModel,
        {
          max_size: 1280,
          steps: 5,
          enable_interpolation: false,
          keep_background: false
        } as VideoSettings,
        200
      );
      expect(result).toBe(discounted(1240.156));
    });

    it("1024, 150 frames, 10 steps, fastmode → 735.942", () => {
      const result = calc(
        magoV4_0_0RenderModel,
        {
          max_size: 1024,
          steps: 10,
          enable_interpolation: true,
          keep_background: false
        } as VideoSettings,
        150
      );
      expect(result).toBe(discounted(735.942));
    });

    it("720, 100 frames, 7 steps, no fastmode → 210.599", () => {
      const result = calc(
        magoV4_0_0RenderModel,
        {
          max_size: 720,
          steps: 7,
          enable_interpolation: false,
          keep_background: false
        } as VideoSettings,
        100
      );
      expect(result).toBe(discounted(210.599));
    });

    it("1920, 300 frames, 8 steps, no fastmode → 10591.84", () => {
      const result = calc(
        magoV4_0_0RenderModel,
        {
          max_size: 1920,
          steps: 8,
          enable_interpolation: false,
          keep_background: false
        } as VideoSettings,
        300
      );
      expect(result).toBe(discounted(10591.84));
    });
  });

  describe("Mago V4.1 via keep_background dispatch — BE validation data", () => {
    it("1280, 200 frames, 5 steps, no fastmode → 889.397", () => {
      const result = calc(
        magoV4_0_0RenderModel,
        {
          max_size: 1280,
          steps: 5,
          enable_interpolation: false,
          keep_background: true
        } as VideoSettings,
        200
      );
      expect(result).toBe(discounted(889.397));
    });

    it("1024, 150 frames, 10 steps, fastmode → 561.192", () => {
      const result = calc(
        magoV4_0_0RenderModel,
        {
          max_size: 1024,
          steps: 10,
          enable_interpolation: true,
          keep_background: true
        } as VideoSettings,
        150
      );
      expect(result).toBe(discounted(561.192));
    });

    it("720, 100 frames, 7 steps, no fastmode → 331.954", () => {
      const result = calc(
        magoV4_0_0RenderModel,
        {
          max_size: 720,
          steps: 7,
          enable_interpolation: false,
          keep_background: true
        } as VideoSettings,
        100
      );
      expect(result).toBe(discounted(331.954));
    });

    it("1920, 300 frames, 8 steps, no fastmode → 6683.06", () => {
      const result = calc(
        magoV4_0_0RenderModel,
        {
          max_size: 1920,
          steps: 8,
          enable_interpolation: false,
          keep_background: true
        } as VideoSettings,
        300
      );
      expect(result).toBe(discounted(6683.06));
    });
  });

  describe("Mago V4.1 direct (magoV4_1_0RenderModel)", () => {
    it("1280, 200 frames, 5 steps, no fastmode → 889.397", () => {
      const result = calc(
        magoV4_1_0RenderModel,
        {
          max_size: 1280,
          steps: 5,
          enable_interpolation: false
        } as VideoSettings,
        200
      );
      expect(result).toBe(discounted(889.397));
    });
  });

  describe("Mago V4.0 vs V4.1 independence", () => {
    it("v4.0 and v4.1 produce different estimates for same settings", () => {
      const settings = {
        max_size: 1280,
        steps: 5,
        enable_interpolation: false,
        keep_background: false
      } as VideoSettings;
      const v40 = calc(magoV4_0_0RenderModel, settings, 200);
      const v41 = calc(
        magoV4_0_0RenderModel,
        { ...settings, keep_background: true },
        200
      );
      expect(v40).not.toBe(v41);
    });
  });

  describe("Mago V5.0 (magoV5_0_0RenderModel) — BE validation data (2026-09-16 eased exponent)", () => {
    it("1280, 200 frames, 4 steps, no fastmode → 770.054", () => {
      const result = calc(
        magoV5_0_0RenderModel,
        {
          max_size: 1280,
          steps: 4,
          enable_interpolation: false
        } as VideoSettings,
        200
      );
      expect(result).toBe(discounted(770.054));
    });

    it("1024, 150 frames, 6 steps, fastmode → 307.575", () => {
      const result = calc(
        magoV5_0_0RenderModel,
        {
          max_size: 1024,
          steps: 6,
          enable_interpolation: true
        } as VideoSettings,
        150
      );
      expect(result).toBe(discounted(307.575));
    });

    it("720, 100 frames, 4 steps, no fastmode → 112.899", () => {
      const result = calc(
        magoV5_0_0RenderModel,
        {
          max_size: 720,
          steps: 4,
          enable_interpolation: false
        } as VideoSettings,
        100
      );
      expect(result).toBe(discounted(112.899));
    });

    it("1920, 300 frames, 8 steps, no fastmode → 4863.594", () => {
      const result = calc(
        magoV5_0_0RenderModel,
        {
          max_size: 1920,
          steps: 8,
          enable_interpolation: false
        } as VideoSettings,
        300
      );
      expect(result).toBe(discounted(4863.594));
    });
  });

  describe("Mago V2.5 (magoV2_5_0RenderModel)", () => {
    it("baseline, 48 frames", () => {
      const result = calc(
        magoV2_5_0RenderModel,
        {
          max_size: 1024,
          steps: 20,
          denoise: 1,
          enable_interpolation: false
        } as VideoSettings,
        48
      );
      expect(result).toBe(1191);
    });
  });

  describe("Mago V3.1 (magoV3_1_0RenderModel)", () => {
    it("baseline, 48 frames", () => {
      const result = calc(
        magoV3_1_0RenderModel,
        {
          max_size: 1024,
          steps: 20,
          denoise: 1,
          enable_interpolation: false
        } as VideoSettings,
        48
      );
      expect(result).toBe(Math.ceil(149.279));
    });
  });

  describe("V5.1 Inpainting (v5_1_0InpaintingRenderModel) — BE validation data", () => {
    it("1280, 200 frames, total_steps 12 → 1524.119", () => {
      const result = calc(
        v5_1_0InpaintingRenderModel,
        {
          max_size: 1280,
          total_steps: 12,
          enable_interpolation: false
        } as VideoSettings,
        200
      );
      expect(result).toBe(discounted(1524.119));
    });

    it("1024, 150 frames, total_steps 8, fastmode → 270.583", () => {
      const result = calc(
        v5_1_0InpaintingRenderModel,
        {
          max_size: 1024,
          total_steps: 8,
          enable_interpolation: true
        } as VideoSettings,
        150
      );
      expect(result).toBe(discounted(270.583));
    });

    it("1920, 300 frames, total_steps 18 → 13611.745", () => {
      const result = calc(
        v5_1_0InpaintingRenderModel,
        {
          max_size: 1920,
          total_steps: 18,
          enable_interpolation: false
        } as VideoSettings,
        300
      );
      expect(result).toBe(discounted(13611.745));
    });
  });

  describe("Upscaler (magoV1_0_0upscalerRenderModel) — BE validation data", () => {
    it("1920, 100 frames, 3x2 tiles, steps 6, denoise 0.4, no fastmode → 664.188", () => {
      const result = calc(
        magoV1_0_0upscalerRenderModel,
        {
          tile_width_count: 3,
          tile_height_count: 2,
          max_size: 1920,
          steps: 6,
          denoise: 0.4,
          enable_interpolation: false
        } as VideoSettings,
        100
      );
      expect(result).toBe(discounted(664.188));
    });

    it("1920, 200 frames, 3x2 tiles, steps 6, denoise 0.4, no fastmode → 1056.215", () => {
      const result = calc(
        magoV1_0_0upscalerRenderModel,
        {
          tile_width_count: 3,
          tile_height_count: 2,
          max_size: 1920,
          steps: 6,
          denoise: 0.4,
          enable_interpolation: false
        } as VideoSettings,
        200
      );
      expect(result).toBe(discounted(1056.215));
    });

    it("1280, 100 frames, 2x2 tiles, steps 8, denoise 0.5, no fastmode → 357.435", () => {
      const result = calc(
        magoV1_0_0upscalerRenderModel,
        {
          tile_width_count: 2,
          tile_height_count: 2,
          max_size: 1280,
          steps: 8,
          denoise: 0.5,
          enable_interpolation: false
        } as VideoSettings,
        100
      );
      expect(result).toBe(discounted(357.435));
    });

    it("1920, 100 frames, 3x2 tiles, steps 6, denoise 0.4, fastmode → 569.932", () => {
      const result = calc(
        magoV1_0_0upscalerRenderModel,
        {
          tile_width_count: 3,
          tile_height_count: 2,
          max_size: 1920,
          steps: 6,
          denoise: 0.4,
          enable_interpolation: true
        } as VideoSettings,
        100
      );
      expect(result).toBe(discounted(569.932));
    });
  });

  describe("Mago V3.3 deprecated (magoV3_3_0RenderModel)", () => {
    it("baseline, 48 frames", () => {
      const result = calc(
        magoV3_3_0RenderModel,
        {
          max_size: 1024,
          steps: 20,
          enable_interpolation: false
        } as VideoSettings,
        48
      );
      expect(result).toBe(Math.ceil(420.099));
    });
  });

  describe("Seedance 2.0 (seedance2Model)", () => {
    it("720p: 120 frames, 24fps → 1850", () => {
      const result = calc(
        seedance2Model,
        { fps: 24, resolution: "720p" } as VideoSettings,
        120
      );
      expect(result).toBe(1850);
    });

    it("720p: 120 frames, 30fps → 1480", () => {
      const result = calc(
        seedance2Model,
        { fps: 30, resolution: "720p" } as VideoSettings,
        120
      );
      expect(result).toBe(1480);
    });

    it("1080p: 120 frames, 24fps → 4165", () => {
      const result = calc(
        seedance2Model,
        { fps: 24, resolution: "1080p" } as VideoSettings,
        120
      );
      expect(result).toBe(4165);
    });

    it("1080p: 120 frames, 30fps → 3332", () => {
      const result = calc(
        seedance2Model,
        { fps: 30, resolution: "1080p" } as VideoSettings,
        120
      );
      expect(result).toBe(3332);
    });
  });

  describe("Happy Horse 1.0 (happyHorse1Model)", () => {
    it("720p: 120 frames, 24fps → 1400", () => {
      const result = calc(
        happyHorse1Model,
        { fps: 24, resolution: "720p" } as VideoSettings,
        120
      );
      expect(result).toBe(1400);
    });

    it("1080p: 120 frames, 24fps → 2800", () => {
      const result = calc(
        happyHorse1Model,
        { fps: 24, resolution: "1080p" } as VideoSettings,
        120
      );
      expect(result).toBe(2800);
    });

    it("caps at 15s: 720p, 600 frames @ 24fps → 4200", () => {
      const result = calc(
        happyHorse1Model,
        { fps: 24, resolution: "720p" } as VideoSettings,
        24 * 25
      );
      expect(result).toBe(15 * 280);
    });
  });

  describe("Invariants", () => {
    it("fastmode always produces smaller estimate than normal mode (v4.0)", () => {
      const base = {
        max_size: 1280,
        steps: 5,
        keep_background: false
      } as VideoSettings;
      const normal = calc(
        magoV4_0_0RenderModel,
        { ...base, enable_interpolation: false },
        200
      );
      const fast = calc(
        magoV4_0_0RenderModel,
        { ...base, enable_interpolation: true },
        200
      );
      expect(fast).toBeLessThan(normal);
    });

    it("fastmode always produces smaller estimate than normal mode (v5.0)", () => {
      const base = {
        max_size: 1280,
        steps: 4
      } as VideoSettings;
      const normal = calc(
        magoV5_0_0RenderModel,
        { ...base, enable_interpolation: false },
        200
      );
      const fast = calc(
        magoV5_0_0RenderModel,
        { ...base, enable_interpolation: true },
        200
      );
      expect(fast).toBeLessThan(normal);
    });
  });
});
