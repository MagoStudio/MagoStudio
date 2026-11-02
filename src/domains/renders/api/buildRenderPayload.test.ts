import { RenderMode } from "@hooks/types";
import { happyHorse1Model } from "@models/video/happyHorse1Model";
import { klingO1Model } from "@models/video/klingO1Model";
import { klingO3EditProModel } from "@models/video/klingO3EditProModel";
import { magoV3_2_0RenderModel } from "@models/video/magoV3_2_0VideoModel";
import { magoV3_4_0RenderModel } from "@models/video/magoV3_4_0VideoModel";
import { magoV4_0_0RenderModel } from "@models/video/magoV4_0_0VideoModel";
import { seedance2I2vModel } from "@models/video/seedance2I2vModel";
import { seedance2Model } from "@models/video/seedance2Model";
import { VideoEngine, VideoSettings } from "@models/video/types";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildRenderPayload } from "./buildRenderPayload";

const baseInput = {
  parentLayerId: "layer-1",
  frameRange: [0, 72],
  inputTrackId: "video-1",
  renderEngine: "magov2",
  renderMode: RenderMode.CREDITS,
  model: happyHorse1Model,
  inputVideoWidth: 1280,
  inputVideoHeight: 720,
  fps: 24
};

describe("buildRenderPayload — stale reference_image_paths leak", () => {
  it("drops a reused reference_image_paths from the Happy Horse wire settings after the image is removed", () => {
    const result = buildRenderPayload({
      ...baseInput,
      sources: [],
      renderSettings: {
        mago_engine: VideoEngine.happy_horse_1,
        prompt: "Add snow",
        image_ids: [],
        reference_image_paths: ["uploads/stale-reference.png"]
      }
    });

    const magov2 = result.render_settings.magov2;
    expect("reference_image_paths" in magov2).toBe(false);
    expect(magov2.reference_image_ids).toBeUndefined();
    expect(result.sources).toEqual({ video: "video-1" });
  });

  it("still sends reference_image_ids from a kept reference_frame source, without the stale paths", () => {
    const result = buildRenderPayload({
      ...baseInput,
      sources: [{ asset_id: "asset-1", type: "reference_frame" }],
      renderSettings: {
        mago_engine: VideoEngine.happy_horse_1,
        prompt: "Add snow",
        reference_image_paths: ["uploads/stale-reference.png"]
      }
    });

    const magov2 = result.render_settings.magov2;
    expect("reference_image_paths" in magov2).toBe(false);
    expect(magov2.reference_image_ids).toEqual(["asset-1"]);
  });

  it("drops a reused image_paths from the Seedance 2 wire settings after the image is removed", () => {
    const result = buildRenderPayload({
      ...baseInput,
      model: seedance2Model,
      sources: [],
      renderSettings: {
        mago_engine: VideoEngine.seedance_2,
        prompt: "Add snow",
        image_ids: [],
        image_paths: ["uploads/stale-reference.png"]
      }
    });

    const magov2 = result.render_settings.magov2;
    expect("image_paths" in magov2).toBe(false);
    expect(magov2.image_ids).toBeUndefined();
    expect(result.sources).toEqual({ video: "video-1" });
  });

  it("drops a reused image_paths from the Kling O3 Edit Pro wire settings after the image is removed", () => {
    const result = buildRenderPayload({
      ...baseInput,
      model: klingO3EditProModel,
      sources: [],
      renderSettings: {
        mago_engine: VideoEngine.kling_o3_edit_pro,
        prompt: "Add snow",
        image_ids: [],
        image_paths: ["uploads/stale-reference.png"]
      }
    });

    const magov2 = result.render_settings.magov2;
    expect("image_paths" in magov2).toBe(false);
    expect(magov2.image_ids).toBeUndefined();
    expect(result.sources).toEqual({ video: "video-1" });
  });

  it("drops a reused image_paths from the Kling O1 wire settings after the image is removed", () => {
    const result = buildRenderPayload({
      ...baseInput,
      model: klingO1Model,
      sources: [],
      renderSettings: {
        mago_engine: VideoEngine.kling_o1,
        prompt: "Add snow",
        image_ids: [],
        image_paths: ["uploads/stale-reference.png"]
      }
    });

    const magov2 = result.render_settings.magov2;
    expect("image_paths" in magov2).toBe(false);
    expect(magov2.image_ids).toBeUndefined();
    expect(result.sources).toEqual({ video: "video-1" });
  });
});

describe("buildRenderPayload — crop payload", () => {
  const rightHalfCrop = { x: 0.5, y: 0, width: 0.5, height: 1 };
  const signedOutDesktopWindow = { mago: { account: { mode: "local" } } };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    { model: seedance2Model, engine: VideoEngine.seedance_2 },
    { model: klingO1Model, engine: VideoEngine.kling_o1 }
  ])(
    "emits neither key for $engine when it renders on Mago cloud, which ignores the crop",
    ({ model, engine }) => {
      const result = buildRenderPayload({
        ...baseInput,
        model,
        inputVideoWidth: 1920,
        inputVideoHeight: 1080,
        sources: [],
        renderSettings: { mago_engine: engine, prompt: "a horse" },
        crop: rightHalfCrop
      });

      const magov2 = result.render_settings.magov2;
      expect("crop_coordinates" in magov2).toBe(false);
      expect("source_video_dimensions" in magov2).toBe(false);
    }
  );

  it("emits integer crop_coordinates and source_video_dimensions for a Mago engine", () => {
    const result = buildRenderPayload({
      ...baseInput,
      model: magoV4_0_0RenderModel,
      inputVideoWidth: 1920,
      inputVideoHeight: 1080,
      sources: [],
      renderSettings: { mago_engine: VideoEngine.V4_0_0, prompt: "a horse" },
      crop: rightHalfCrop
    });

    const magov2 = result.render_settings.magov2;
    expect(magov2.crop_coordinates).toEqual({
      top_left: [960, 0],
      bottom_right: [1920, 1080]
    });
    expect(magov2.source_video_dimensions).toEqual([1920, 1080]);
  });

  it("emits neither key when no crop is set", () => {
    const result = buildRenderPayload({
      ...baseInput,
      model: magoV4_0_0RenderModel,
      inputVideoWidth: 1920,
      inputVideoHeight: 1080,
      sources: [],
      renderSettings: { mago_engine: VideoEngine.V4_0_0, prompt: "a horse" }
    });

    const magov2 = result.render_settings.magov2;
    expect("crop_coordinates" in magov2).toBe(false);
    expect("source_video_dimensions" in magov2).toBe(false);
  });

  it("omits crop keys for Seedance 2 even while signed out", () => {
    vi.stubGlobal("window", signedOutDesktopWindow);
    const result = buildRenderPayload({
      ...baseInput,
      model: seedance2Model,
      inputVideoWidth: 1920,
      inputVideoHeight: 1080,
      sources: [],
      renderSettings: {
        mago_engine: VideoEngine.seedance_2,
        prompt: "a horse"
      },
      crop: rightHalfCrop
    });

    const magov2 = result.render_settings.magov2;
    expect(magov2.crop_coordinates).toBeUndefined();
    expect(magov2.source_video_dimensions).toBeUndefined();
  });

  it("omits crop keys for a Kling engine even while signed out", () => {
    vi.stubGlobal("window", signedOutDesktopWindow);
    const result = buildRenderPayload({
      ...baseInput,
      model: klingO1Model,
      inputVideoWidth: 1920,
      inputVideoHeight: 1080,
      sources: [],
      renderSettings: { mago_engine: VideoEngine.kling_o1, prompt: "a horse" },
      crop: rightHalfCrop
    });

    const magov2 = result.render_settings.magov2;
    expect(magov2.crop_coordinates).toBeUndefined();
    expect(magov2.source_video_dimensions).toBeUndefined();
  });

  it("emits neither key for a full-frame box", () => {
    const result = buildRenderPayload({
      ...baseInput,
      model: magoV4_0_0RenderModel,
      inputVideoWidth: 1920,
      inputVideoHeight: 1080,
      sources: [],
      renderSettings: { mago_engine: VideoEngine.V4_0_0, prompt: "a horse" },
      crop: { x: 0, y: 0, width: 1, height: 1 }
    });

    const magov2 = result.render_settings.magov2;
    expect("crop_coordinates" in magov2).toBe(false);
    expect("source_video_dimensions" in magov2).toBe(false);
  });

  it("emits neither key when the input dimensions are unknown", () => {
    const result = buildRenderPayload({
      ...baseInput,
      model: magoV4_0_0RenderModel,
      inputVideoWidth: undefined,
      inputVideoHeight: undefined,
      sources: [],
      renderSettings: { mago_engine: VideoEngine.V4_0_0, prompt: "a horse" },
      crop: rightHalfCrop
    });

    const magov2 = result.render_settings.magov2;
    expect("crop_coordinates" in magov2).toBe(false);
    expect("source_video_dimensions" in magov2).toBe(false);
  });

  it("strips stale crop_coordinates/source_video_dimensions carried over in persisted settings for a non-crop-capable engine", () => {
    const staleSettings = {
      mago_engine: VideoEngine.seedance_2,
      prompt: "a horse",
      crop_coordinates: { top_left: [0, 0], bottom_right: [100, 100] },
      source_video_dimensions: [1920, 1080]
    } as unknown as VideoSettings;

    const result = buildRenderPayload({
      ...baseInput,
      model: seedance2Model,
      inputVideoWidth: 1920,
      inputVideoHeight: 1080,
      sources: [],
      renderSettings: staleSettings
    });

    const magov2 = result.render_settings.magov2;
    expect("crop_coordinates" in magov2).toBe(false);
    expect("source_video_dimensions" in magov2).toBe(false);
  });

  it("recomputes absolute coordinates from the current source dimensions instead of reusing stale persisted ones after a resolution switch", () => {
    const crop = { x: 0.5, y: 0, width: 0.5, height: 1 };
    const staleSettingsFromPreviousResolution = {
      mago_engine: VideoEngine.V4_0_0,
      prompt: "a horse",
      crop_coordinates: { top_left: [480, 0], bottom_right: [960, 540] },
      source_video_dimensions: [960, 540]
    } as unknown as VideoSettings;

    const result = buildRenderPayload({
      ...baseInput,
      model: magoV4_0_0RenderModel,
      inputVideoWidth: 1920,
      inputVideoHeight: 1080,
      sources: [],
      renderSettings: staleSettingsFromPreviousResolution,
      crop
    });

    const magov2 = result.render_settings.magov2;
    expect(magov2.crop_coordinates).toEqual({
      top_left: [960, 0],
      bottom_right: [1920, 1080]
    });
    expect(magov2.source_video_dimensions).toEqual([1920, 1080]);
  });

  it("rounds a fractional pixel crop to whole numbers", () => {
    const result = buildRenderPayload({
      ...baseInput,
      model: magoV4_0_0RenderModel,
      inputVideoWidth: 1001,
      inputVideoHeight: 1001,
      sources: [],
      renderSettings: { mago_engine: VideoEngine.V4_0_0, prompt: "a horse" },
      crop: { x: 0.1, y: 0.1, width: 0.3, height: 0.3 }
    });

    const magov2 = result.render_settings.magov2;
    const cropCoordinates = magov2.crop_coordinates as {
      top_left: [number, number];
      bottom_right: [number, number];
    };
    expect(Number.isInteger(cropCoordinates.top_left[0])).toBe(true);
    expect(Number.isInteger(cropCoordinates.top_left[1])).toBe(true);
    expect(Number.isInteger(cropCoordinates.bottom_right[0])).toBe(true);
    expect(Number.isInteger(cropCoordinates.bottom_right[1])).toBe(true);
  });
});

describe("buildRenderPayload — image-to-video render", () => {
  it("passes an empty sources object through untouched despite a populated sources list and input track id", () => {
    const result = buildRenderPayload({
      ...baseInput,
      model: seedance2I2vModel,
      sources: [{ asset_id: "ref", type: "reference_frame" }],
      renderSettings: {
        mago_engine: VideoEngine.seedance_2_i2v,
        prompt: "a horse running",
        image_id: "asset-1"
      }
    });

    expect(result.sources).toEqual({});
    expect(result.render_settings.magov2.image_id).toBe("asset-1");
  });
});

describe("buildRenderPayload — unified sources.images", () => {
  it("Seedance sends its reference_frame sources as sources.images", () => {
    const body = buildRenderPayload({
      ...baseInput,
      model: seedance2Model,
      renderSettings: { mago_engine: "seedance_2" },
      sources: [
        { asset_id: "a", type: "reference_frame" },
        { asset_id: "b", type: "reference_frame" }
      ]
    });
    expect(body.sources).toEqual({
      video: "video-1",
      images: [
        { asset_id: "a", type: "reference_frame" },
        { asset_id: "b", type: "reference_frame" }
      ]
    });
  });

  it("Happy Horse sends its reference_frame sources as sources.images", () => {
    const body = buildRenderPayload({
      ...baseInput,
      model: happyHorse1Model,
      renderSettings: { mago_engine: "happy_horse_1" },
      sources: [{ asset_id: "h", type: "reference_frame" }]
    });
    expect(body.sources.images).toEqual([
      { asset_id: "h", type: "reference_frame" }
    ]);
  });

  it("Kling O1 sends references and element pair as typed sources.images", () => {
    const body = buildRenderPayload({
      ...baseInput,
      model: klingO1Model,
      renderSettings: { mago_engine: "kling_o1" },
      sources: [
        { asset_id: "ref", type: "reference_frame" },
        { asset_id: "er", type: "element_reference", index: 0 },
        { asset_id: "ef", type: "element_frontal", index: 0 }
      ]
    });
    expect(body.sources.images).toEqual([
      { asset_id: "ref", type: "reference_frame" },
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ]);
  });

  it("Mago engines keep sending their sources list unchanged", () => {
    const body = buildRenderPayload({
      ...baseInput,
      model: magoV4_0_0RenderModel,
      renderSettings: { mago_engine: "v4.0.0" },
      sources: [{ asset_id: "r", type: "reference_frame" }]
    });
    expect(body.sources.images).toEqual([
      { asset_id: "r", type: "reference_frame" }
    ]);
  });
});

describe("buildRenderPayload — facemesh blending declared on the model", () => {
  it("forces the value off for a model declaring facemesh blending unsupported", () => {
    const body = buildRenderPayload({
      ...baseInput,
      model: magoV3_4_0RenderModel,
      renderSettings: {
        mago_engine: VideoEngine.V3_4_0,
        enable_facemesh_blending: true
      },
      sources: []
    });

    expect(body.render_settings.magov2.enable_facemesh_blending).toBe(false);
  });

  it("keeps the chosen value for a model declaring facemesh blending supported", () => {
    const body = buildRenderPayload({
      ...baseInput,
      model: magoV3_2_0RenderModel,
      renderSettings: {
        mago_engine: VideoEngine.V3_2_0,
        enable_facemesh_blending: true
      },
      sources: []
    });

    expect(body.render_settings.magov2.enable_facemesh_blending).toBe(true);
  });

  it("adds no facemesh key for a model that does not expose the setting", () => {
    const body = buildRenderPayload({
      ...baseInput,
      model: magoV4_0_0RenderModel,
      renderSettings: { mago_engine: VideoEngine.V4_0_0 },
      sources: []
    });

    expect("enable_facemesh_blending" in body.render_settings.magov2).toBe(
      false
    );
  });
});
