import { SourceImage } from "@domains/renders/types";
import { NormalizedCropRect } from "@domains/renders/utils/cropRect";
import { magoV5_0_0RenderModel } from "@models/video/magoV5_0_0VideoModel";
import {
  IMAGE_SEQUENCE_EXPORT,
  VideoEngine,
  VideoSettings
} from "@models/video/types";
import { describe, expect, it } from "vitest";

import { buildRenderPayload } from "../buildRenderPayload";

import { alwaysEmittedWireKeys } from "./alwaysEmittedWireKeys";
import { baseRenderPayloadInput } from "./baseRenderPayloadInput";
import { expectNoLegacyImageKeys } from "./expectNoLegacyImageKeys";
import { WIRE_KEYS_PENDING_REMOVAL_MAG_4625 } from "./wireKeysPendingRemovalMag4625";

const canonicalRenderSettings: VideoSettings = {
  mago_engine: VideoEngine.V5_0_0,
  source_image_slot: "asset-mago-v500",
  prompt: "Style transfer prompt describing the target look",
  negative_prompt: "bad quality, low quality, naked, nude, racy, nsfw",
  max_size: 1280,
  steps: 4,
  split_step_percentage: 40,
  raw_video_cn_strength: 0.5,
  enable_interpolation: false,
  v5_chunk_size: 150,
  image_sequence_export: IMAGE_SEQUENCE_EXPORT.PNG,
  cfg: 1,
  v5_chunk_overlap: 10,
  dynamic_reference_frame: true,
  keyframe_index: 3,
  color_match_strength: 0,
  shift: 8,
  low_step_accelerator: 1,
  seed: 42,
  bypass_tiling: true,
  lora_1: 0.5
};

const canonicalSources: SourceImage[] = [
  { asset_id: "asset-mago-v500", type: "key_frame", index: 0 }
];

const expectedMagov2 = {
  mago_engine: VideoEngine.V5_0_0,
  prompt: "Style transfer prompt describing the target look",
  negative_prompt: "bad quality, low quality, naked, nude, racy, nsfw",
  max_size: 1280,
  steps: 4,
  raw_video_cn_strength: 0.5,
  enable_interpolation: false,
  v5_chunk_size: 150,
  cfg: 1,
  v5_chunk_overlap: 10,
  dynamic_reference_frame: true,
  color_match_strength: 0,
  shift: 8,
  low_step_accelerator: 1,
  seed: 42,
  bypass_tiling: true,
  skip_cnet_preprocess: true,
  custom_loras: [],
  split_step_percentage: 40,
  split_step: 2,
  ...WIRE_KEYS_PENDING_REMOVAL_MAG_4625,
  ...alwaysEmittedWireKeys({
    frameRange: baseRenderPayloadInput.frameRange,
    convertExrsToPngs: true
  })
};

const expectedSourcesWithOneImage = {
  video: baseRenderPayloadInput.inputTrackId,
  images: [{ asset_id: "asset-mago-v500", type: "reference_frame" }]
};

const expectedBody = {
  parent_layer_id: baseRenderPayloadInput.parentLayerId,
  frame_range: baseRenderPayloadInput.frameRange,
  render_mode: baseRenderPayloadInput.renderMode,
  render_settings: { magov2: expectedMagov2 },
  sources: expectedSourcesWithOneImage,
  render_engine: baseRenderPayloadInput.renderEngine
};

describe("buildRenderPayload wire pin — v5.0.0", () => {
  it("pins the full request body — every root field, render_settings.magov2 and sources — for a canonical uncropped render", () => {
    const body = buildRenderPayload({
      ...baseRenderPayloadInput,
      model: magoV5_0_0RenderModel,
      renderSettings: canonicalRenderSettings,
      sources: canonicalSources
    });

    expect(body).toEqual(expectedBody);
    expect(body.render_settings.magov2.steps).toBe(4);
    expect(body.render_settings.magov2.max_size).toBe(1280);
    expectNoLegacyImageKeys(body.render_settings.magov2);
    expect("ipadapter_image_source" in body.sources).toBe(false);
  });

  it("discards all but the primary reference image", () => {
    const threeUploadedSources: SourceImage[] = [
      { asset_id: "asset-a", type: "key_frame", index: 0 },
      { asset_id: "asset-b", type: "key_frame", index: 1 },
      { asset_id: "asset-c", type: "key_frame", index: 2 }
    ];

    const body = buildRenderPayload({
      ...baseRenderPayloadInput,
      model: magoV5_0_0RenderModel,
      renderSettings: canonicalRenderSettings,
      sources: threeUploadedSources
    });

    expect(body.sources).toEqual({
      video: baseRenderPayloadInput.inputTrackId,
      images: [{ asset_id: "asset-a", type: "reference_frame" }]
    });
  });

  it("pins crop_coordinates and source_video_dimensions for a normalized crop", () => {
    const crop: NormalizedCropRect = {
      x: 0.1,
      y: 0.2,
      width: 0.5,
      height: 0.4
    };

    const body = buildRenderPayload({
      ...baseRenderPayloadInput,
      model: magoV5_0_0RenderModel,
      renderSettings: canonicalRenderSettings,
      sources: canonicalSources,
      crop
    });

    expect(body.render_settings.magov2).toEqual({
      ...expectedMagov2,
      crop_coordinates: { top_left: [128, 144], bottom_right: [768, 432] },
      source_video_dimensions: [1280, 720]
    });
  });

  it("emits no images key on sources when no image was uploaded", () => {
    const body = buildRenderPayload({
      ...baseRenderPayloadInput,
      model: magoV5_0_0RenderModel,
      renderSettings: canonicalRenderSettings,
      sources: []
    });

    expect(body.sources).toEqual({
      video: baseRenderPayloadInput.inputTrackId
    });
    expect(body.render_settings.magov2).toEqual(expectedMagov2);
  });
});
