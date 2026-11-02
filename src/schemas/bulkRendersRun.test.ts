import { describe, expect, it } from "vitest";

import {
  BulkRendersRunSchema,
  CreateBulkRendersRunRequestSchema
} from "./bulkRendersRun";

const BASE_REQUEST = {
  project_id: "project-1",
  timeline_ids: ["shot-1"]
};

const SUPPLIED_FRAME = [
  { asset_id: "asset-1", type: "reference_frame" as const }
];

describe("CreateBulkRendersRunRequestSchema shot_overrides", () => {
  it("accepts a prompt-only override", () => {
    const result = CreateBulkRendersRunRequestSchema.safeParse({
      ...BASE_REQUEST,
      shot_overrides: {
        "shot-1": {
          img2img_settings: { prompt: "edited" },
          video_settings: { prompt: "edited" }
        }
      }
    });
    expect(result.success).toBe(true);
  });

  it("accepts a supplied frame alongside a video prompt override", () => {
    const result = CreateBulkRendersRunRequestSchema.safeParse({
      ...BASE_REQUEST,
      shot_overrides: {
        "shot-1": {
          images: SUPPLIED_FRAME,
          video_settings: { prompt: "edited" }
        }
      }
    });
    expect(result.success).toBe(true);
  });

  it("rejects a supplied frame combined with img2img_settings, which the backend would silently drop", () => {
    const result = CreateBulkRendersRunRequestSchema.safeParse({
      ...BASE_REQUEST,
      shot_overrides: {
        "shot-1": {
          images: SUPPLIED_FRAME,
          img2img_settings: { prompt: "silently lost on the backend" }
        }
      }
    });
    expect(result.success).toBe(false);
  });
});

const BASE_RUN = {
  id: "run-1",
  status: "PAUSED" as const
};

describe("BulkRendersRunSchema echoed pricing fields", () => {
  it("types the video engine, frame range and numeric model settings the backend echoes back", () => {
    const result = BulkRendersRunSchema.parse({
      ...BASE_RUN,
      input_settings: {
        video_settings: {
          engine: "v4_1_0",
          frame_range: [0, 48],
          width: 1024,
          height: 576
        }
      }
    });

    expect(result.input_settings?.video_settings?.engine).toBe("v4_1_0");
    expect(result.input_settings?.video_settings?.frame_range).toEqual([0, 48]);
    expect(result.input_settings?.video_settings?.width).toBe(1024);
    expect(result.input_settings?.video_settings?.height).toBe(576);
  });

  it("types the echoed image render model", () => {
    const result = BulkRendersRunSchema.parse({
      ...BASE_RUN,
      input_settings: {
        img2img_settings: {
          render_model: "gpt_image_2"
        }
      }
    });

    expect(result.input_settings?.img2img_settings?.render_model).toBe(
      "gpt_image_2"
    );
  });

  it("types the Mago-family model's max_size, a video model dependency task 3.1 found in place of width/height", () => {
    const result = BulkRendersRunSchema.parse({
      ...BASE_RUN,
      input_settings: {
        video_settings: {
          engine: "v4.0.0",
          max_size: 1024,
          fps: 24
        }
      }
    });

    expect(result.input_settings?.video_settings?.max_size).toBe(1024);
    expect(result.input_settings?.video_settings?.fps).toBe(24);
  });

  it("types the echoed image quality and resolution used by the per-model image credit tables", () => {
    const result = BulkRendersRunSchema.parse({
      ...BASE_RUN,
      input_settings: {
        img2img_settings: {
          render_model: "gpt_image_2",
          quality: "high"
        }
      }
    });

    expect(result.input_settings?.img2img_settings?.quality).toBe("high");
  });

  it("still passes through settings keys it does not name", () => {
    const result = BulkRendersRunSchema.safeParse({
      ...BASE_RUN,
      input_settings: {
        video_settings: {
          enable_facemesh_blending: false,
          lora_name: "some-lora"
        }
      }
    });

    expect(result.success).toBe(true);
  });

  it("parses a settings object whose unset numeric/string fields are echoed as null, the ordinary JSON shape of an unset backend value", () => {
    const result = BulkRendersRunSchema.safeParse({
      ...BASE_RUN,
      input_settings: {
        video_settings: {
          engine: "v4_1_0",
          frame_range: null,
          width: null,
          height: null,
          max_size: null,
          fps: null,
          resolution: null,
          quality: null,
          upscale_scale_factor: null,
          skip_polling: null,
          skip_metrics: null,
          max_quality_retries: null,
          render_model: null
        },
        img2img_settings: {
          render_model: null,
          quality: null
        }
      }
    });

    expect(result.success).toBe(true);
  });

  it("falls back rather than throwing when frame_range is not a two-number tuple", () => {
    const result = BulkRendersRunSchema.safeParse({
      ...BASE_RUN,
      input_settings: {
        video_settings: {
          engine: "v4_1_0",
          frame_range: [0, 24, 48]
        }
      }
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.input_settings?.video_settings?.frame_range).toBe(
        undefined
      );
    }
  });
});
