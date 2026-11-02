import { SourceImage } from "@domains/renders/types";
import { RenderMode } from "@hooks/types";
import { kling2_6MotionControlModel } from "@models/video/kling2_6MotionControlModel";
import { kling3_0MotionControlModel } from "@models/video/kling3_0MotionControlModel";
import { magoV3_4_0RenderModel } from "@models/video/magoV3_4_0VideoModel";
import { magoV5_0_0RenderModel } from "@models/video/magoV5_0_0VideoModel";
import { magoV7_0_0RenderModel } from "@models/video/magoV7_0_0VideoModel";
import { magoV8_0_0RenderModel } from "@models/video/magoV8_0_0VideoModel";
import {
  IMAGE_SEQUENCE_EXPORT,
  VideoEngine,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { post: vi.fn() }
}));

import { backendApiClient } from "@/lib/backend-api-client";

import { postRender } from "./postRender";

const post = backendApiClient.post as unknown as ReturnType<typeof vi.fn>;

const callPostRender = (
  model: VideoModelDefinition,
  engine: VideoEngine,
  overrides: Partial<VideoSettings>,
  sources: SourceImage[] = []
) =>
  postRender({
    parentLayerId: "parent",
    frameRange: [0, 10],
    renderSettings: {
      mago_engine: engine,
      ...overrides
    } as unknown as VideoSettings,
    sources,
    inputTrackId: "track",
    renderEngine: "magov2",
    renderMode: "QUALITY" as RenderMode,
    model,
    fps: 24
  });

const lastPayload = () => post.mock.calls.at(-1)![1];

describe("postRender — image_sequence_export → convert_exrs_to_pngs", () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({ data: { id: "layer" } });
  });

  describe.each([
    {
      label: "Mago Transform",
      model: magoV3_4_0RenderModel,
      engine: VideoEngine.V3_4_0
    },
    {
      label: "Mago V5 (Style Transfer preset)",
      model: magoV5_0_0RenderModel,
      engine: VideoEngine.V5_0_0
    }
  ])("$label", ({ model, engine }) => {
    it("sends convert_exrs_to_pngs: true when PNG is selected", async () => {
      await callPostRender(model, engine, {
        image_sequence_export: IMAGE_SEQUENCE_EXPORT.PNG
      });
      expect(lastPayload().render_settings.magov2.convert_exrs_to_pngs).toBe(
        true
      );
    });

    it("sends convert_exrs_to_pngs: false when EXR 16-bit is selected", async () => {
      await callPostRender(model, engine, {
        image_sequence_export: IMAGE_SEQUENCE_EXPORT.EXR_16BIT
      });
      expect(lastPayload().render_settings.magov2.convert_exrs_to_pngs).toBe(
        false
      );
    });

    it("strips legacy convert_pngs_to_exrs and exr_use_float16 from stored settings", async () => {
      await callPostRender(model, engine, {
        image_sequence_export: IMAGE_SEQUENCE_EXPORT.PNG,
        convert_pngs_to_exrs: true,
        exr_use_float16: true
      } as unknown as Partial<VideoSettings>);

      const magov2 = lastPayload().render_settings.magov2;
      expect(magov2).not.toHaveProperty("convert_pngs_to_exrs");
      expect(magov2).not.toHaveProperty("exr_use_float16");
      expect(magov2).not.toHaveProperty("image_sequence_export");
      expect(magov2.convert_exrs_to_pngs).toBe(true);
    });

    it("defaults to convert_exrs_to_pngs: true when image_sequence_export is missing", async () => {
      await callPostRender(model, engine, {});
      expect(lastPayload().render_settings.magov2.convert_exrs_to_pngs).toBe(
        true
      );
    });

    it("treats any non-EXR-16-bit value (including legacy exr_32bit) as PNG conversion", async () => {
      await callPostRender(model, engine, {
        image_sequence_export: "exr_32bit"
      });
      expect(lastPayload().render_settings.magov2.convert_exrs_to_pngs).toBe(
        true
      );
    });
  });
});

describe("postRender — v7.0.0 (Mago SDR-to-HDR) forces EXR output", () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({ data: { id: "layer" } });
  });

  it("sends convert_exrs_to_pngs: false when nothing is selected", async () => {
    await callPostRender(magoV7_0_0RenderModel, VideoEngine.V7_0_0, {});
    expect(lastPayload().render_settings.magov2.convert_exrs_to_pngs).toBe(
      false
    );
  });

  it("keeps convert_exrs_to_pngs: false even when PNG is in stored settings", async () => {
    await callPostRender(magoV7_0_0RenderModel, VideoEngine.V7_0_0, {
      image_sequence_export: IMAGE_SEQUENCE_EXPORT.PNG
    });
    const magov2 = lastPayload().render_settings.magov2;
    expect(magov2.convert_exrs_to_pngs).toBe(false);
    expect(magov2).not.toHaveProperty("image_sequence_export");
  });
});

describe("postRender — v8.0.0 (Mago Clean Plate) outputs standard frames", () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({ data: { id: "layer" } });
  });

  it("sends convert_exrs_to_pngs: true when nothing is selected", async () => {
    await callPostRender(magoV8_0_0RenderModel, VideoEngine.V8_0_0, {});
    expect(lastPayload().render_settings.magov2.convert_exrs_to_pngs).toBe(
      true
    );
  });

  it("forwards prompt and negative_prompt to render_settings.magov2", async () => {
    await callPostRender(magoV8_0_0RenderModel, VideoEngine.V8_0_0, {
      prompt: "empty room, no people, clean background",
      negative_prompt: "people, subjects"
    } as unknown as Partial<VideoSettings>);

    const magov2 = lastPayload().render_settings.magov2;
    expect(magov2.prompt).toBe("empty room, no people, clean background");
    expect(magov2.negative_prompt).toBe("people, subjects");
    expect(magov2.mago_engine).toBe(VideoEngine.V8_0_0);
  });
});

describe("postRender — keyframe_index stripping", () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({ data: { id: "layer" } });
  });

  it("strips keyframe_index from outgoing render_settings.magov2", async () => {
    await callPostRender(magoV3_4_0RenderModel, VideoEngine.V3_4_0, {
      keyframe_index: 5
    } as unknown as Partial<VideoSettings>);

    const magov2 = lastPayload().render_settings.magov2;
    expect(magov2).not.toHaveProperty("keyframe_index");
  });

  it("strips keyframe_index for V5 as well", async () => {
    await callPostRender(magoV5_0_0RenderModel, VideoEngine.V5_0_0, {
      keyframe_index: 0
    } as unknown as Partial<VideoSettings>);

    expect(lastPayload().render_settings.magov2).not.toHaveProperty(
      "keyframe_index"
    );
  });

  it("strips the image Modify Frame's keyframe_index belongs to", async () => {
    await callPostRender(magoV5_0_0RenderModel, VideoEngine.V5_0_0, {
      keyframe_index: 0,
      keyframe_index_asset_id: "modified"
    } as unknown as Partial<VideoSettings>);

    expect(lastPayload().render_settings.magov2).not.toHaveProperty(
      "keyframe_index_asset_id"
    );
  });
});

describe("postRender — Kling reference image from sources", () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({ data: { id: "layer" } });
  });

  describe.each([
    {
      label: "Kling 2.6 Motion Control",
      model: kling2_6MotionControlModel,
      engine: VideoEngine.kling_2_6_motion_control
    },
    {
      label: "Kling 3.0 Motion Control",
      model: kling3_0MotionControlModel,
      engine: VideoEngine.kling_3_motion_control
    }
  ])("$label", ({ model, engine }) => {
    it("derives image_id from the motion_reference source — no bridge injection", async () => {
      await callPostRender(model, engine, {}, [
        { asset_id: "char-uuid", type: "motion_reference" }
      ]);
      expect(lastPayload().render_settings.magov2.image_id).toBe("char-uuid");
    });

    it("leaves image_id undefined when sources are empty", async () => {
      await callPostRender(model, engine, {}, []);
      expect(lastPayload().render_settings.magov2.image_id).toBeUndefined();
    });
  });
});

describe("postRender — V3.4 additional reference image", () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({ data: { id: "layer" } });
  });

  it("strips additional_reference_image from outgoing render_settings.magov2", async () => {
    await callPostRender(magoV3_4_0RenderModel, VideoEngine.V3_4_0, {
      additional_reference_image: ["ref-1"]
    } as unknown as Partial<VideoSettings>);

    const magov2 = lastPayload().render_settings.magov2;
    expect(magov2).not.toHaveProperty("additional_reference_image");
  });

  it("strips legacy background_images / character_images / objects_images from outgoing render_settings.magov2", async () => {
    await callPostRender(magoV3_4_0RenderModel, VideoEngine.V3_4_0, {
      background_images: ["bg"],
      character_images: ["ch"],
      objects_images: ["obj"]
    } as unknown as Partial<VideoSettings>);

    const magov2 = lastPayload().render_settings.magov2;
    expect(magov2).not.toHaveProperty("background_images");
    expect(magov2).not.toHaveProperty("character_images");
    expect(magov2).not.toHaveProperty("objects_images");
  });
});
