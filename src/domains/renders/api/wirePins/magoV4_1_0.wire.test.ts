import { SourceImage } from "@domains/renders/types";
import { NormalizedCropRect } from "@domains/renders/utils/cropRect";
import { magoV4_1_0RenderModel } from "@models/video/magoV4_1_0VideoModel";
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

const negativePrompt =
  "Vivid tones, overexposed, static, blurry details, subtitles, work, still image, overall grayish, worst quality, low quality, JPEG compression artifacts, ugly, defective, extra fingers, poorly drawn hands, poorly drawn face, deformed, disfigured, malformed limbs, fused fingers, motionless image, messy background, three legs, crowded background, walking backwards";

const canonicalRenderSettings: VideoSettings = {
  mago_engine: VideoEngine.V4_1_0,
  source_image_slot: "asset-mago-v410",
  keep_background: true,
  prompt: "Replace the character and keep the background",
  negative_prompt: negativePrompt,
  max_size: 1280,
  steps: 5,
  enable_interpolation: false,
  pose_strength: 1,
  face_strength: 1,
  v4_chunk_size: 300,
  image_sequence_export: IMAGE_SEQUENCE_EXPORT.PNG,
  v4_chunk_overlap: 1,
  dynamic_reference_frame: false,
  crop_padding: 50,
  cfg: 1,
  relight: 1,
  shift: 5,
  long_context_lora_strength: 1,
  colormatch: false,
  seed: 42,
  temporal_window_size: 77
};

const canonicalSources: SourceImage[] = [
  { asset_id: "asset-mago-v410", type: "key_frame", index: 0 }
];

const expectedMagov2 = {
  mago_engine: VideoEngine.V4_1_0,
  keep_background: true,
  prompt: "Replace the character and keep the background",
  negative_prompt: negativePrompt,
  max_size: 1280,
  steps: 5,
  enable_interpolation: false,
  pose_strength: 1,
  face_strength: 1,
  v4_chunk_size: 300,
  v4_chunk_overlap: 1,
  dynamic_reference_frame: false,
  crop_padding: 50,
  cfg: 1,
  relight: 1,
  shift: 5,
  long_context_lora_strength: 1,
  colormatch: false,
  seed: 42,
  temporal_window_size: 77,
  ...WIRE_KEYS_PENDING_REMOVAL_MAG_4625,
  ...alwaysEmittedWireKeys({
    frameRange: baseRenderPayloadInput.frameRange,
    convertExrsToPngs: true
  })
};

const expectedSourcesWithOneImage = {
  video: baseRenderPayloadInput.inputTrackId,
  images: [{ asset_id: "asset-mago-v410", type: "reference_frame" }]
};

const expectedBody = {
  parent_layer_id: baseRenderPayloadInput.parentLayerId,
  frame_range: baseRenderPayloadInput.frameRange,
  render_mode: baseRenderPayloadInput.renderMode,
  render_settings: { magov2: expectedMagov2 },
  sources: expectedSourcesWithOneImage,
  render_engine: baseRenderPayloadInput.renderEngine
};

describe("buildRenderPayload wire pin — v4.1.0", () => {
  it("pins the full request body — every root field, render_settings.magov2 and sources — for a canonical uncropped render", () => {
    const body = buildRenderPayload({
      ...baseRenderPayloadInput,
      model: magoV4_1_0RenderModel,
      renderSettings: canonicalRenderSettings,
      sources: canonicalSources
    });

    expect(body).toEqual(expectedBody);
    expect(body.render_settings.magov2.steps).toBe(5);
    expect(body.render_settings.magov2.max_size).toBe(1280);
    expectNoLegacyImageKeys(body.render_settings.magov2);
  });

  it("discards all but the primary reference image", () => {
    const threeUploadedSources: SourceImage[] = [
      { asset_id: "asset-a", type: "key_frame", index: 0 },
      { asset_id: "asset-b", type: "key_frame", index: 1 },
      { asset_id: "asset-c", type: "key_frame", index: 2 }
    ];

    const body = buildRenderPayload({
      ...baseRenderPayloadInput,
      model: magoV4_1_0RenderModel,
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
      model: magoV4_1_0RenderModel,
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
      model: magoV4_1_0RenderModel,
      renderSettings: canonicalRenderSettings,
      sources: []
    });

    expect(body.sources).toEqual({
      video: baseRenderPayloadInput.inputTrackId
    });
    expect(body.render_settings.magov2).toEqual(expectedMagov2);
  });
});
