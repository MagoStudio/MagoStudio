import { SourceImage } from "@domains/renders/types";
import { magoV2_5_0RenderModel } from "@models/video/magoV2_5_0VideoModel";
import { magoV3_4_0RenderModel } from "@models/video/magoV3_4_0VideoModel";
import { magoV4_0_0RenderModel } from "@models/video/magoV4_0_0VideoModel";
import { magoV4_1_0RenderModel } from "@models/video/magoV4_1_0VideoModel";
import { magoV5_0_0RenderModel } from "@models/video/magoV5_0_0VideoModel";
import { v5_1_0InpaintingRenderModel } from "@models/video/v5_1_0InpaintingVideoModel";
import { Layer } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { getShouldShowCropKeyFrameWarning } from "./getShouldShowCropKeyFrameWarning";

const ACTIVE_CROP = { x: 0.5, y: 0, width: 0.5, height: 1 };
const UPLOADED_KEY_FRAME_SOURCE: SourceImage[] = [
  { asset_id: "uploaded-1", type: "key_frame", index: 0 }
];
const UPLOADED_REFERENCE_FRAME_SOURCE: SourceImage[] = [
  { asset_id: "uploaded-1", type: "reference_frame" }
];

describe("getShouldShowCropKeyFrameWarning", () => {
  it.each([["V3.4.0", magoV3_4_0RenderModel]])(
    "warns for %s, which emits the stylize frame as a wire key_frame",
    (_label, model) => {
      const result = getShouldShowCropKeyFrameWarning({
        crop: ACTIVE_CROP,
        model,
        sources: UPLOADED_REFERENCE_FRAME_SOURCE,
        tracks: []
      });

      expect(result).toBe(true);
    }
  );

  it.each([
    ["V5.1.0 Inpainting", v5_1_0InpaintingRenderModel],
    ["V2.5.0", magoV2_5_0RenderModel]
  ])(
    "warns for %s when the stored stylize source is already a key_frame (pass-through engine)",
    (_label, model) => {
      const result = getShouldShowCropKeyFrameWarning({
        crop: ACTIVE_CROP,
        model,
        sources: UPLOADED_KEY_FRAME_SOURCE,
        tracks: []
      });

      expect(result).toBe(true);
    }
  );

  it.each([
    ["V4.0.0", magoV4_0_0RenderModel],
    ["V4.1.0", magoV4_1_0RenderModel],
    ["V5.0.0", magoV5_0_0RenderModel]
  ])(
    "never warns for %s — the adapter emits reference_frame only",
    (_label, model) => {
      const result = getShouldShowCropKeyFrameWarning({
        crop: ACTIVE_CROP,
        model,
        sources: UPLOADED_KEY_FRAME_SOURCE,
        tracks: []
      });

      expect(result).toBe(false);
    }
  );

  it("does not warn when no crop is active", () => {
    const result = getShouldShowCropKeyFrameWarning({
      crop: undefined,
      model: magoV3_4_0RenderModel,
      sources: UPLOADED_REFERENCE_FRAME_SOURCE,
      tracks: []
    });

    expect(result).toBe(false);
  });

  it("does not warn when there is no stylize frame attached", () => {
    const result = getShouldShowCropKeyFrameWarning({
      crop: ACTIVE_CROP,
      model: magoV3_4_0RenderModel,
      sources: [],
      tracks: []
    });

    expect(result).toBe(false);
  });

  it("does not warn when the stylize frame was itself generated under a crop", () => {
    const generatedTrack = {
      id: "generated-track",
      clips: [
        {
          asset_id: "generated-1",
          data: {
            crop_coordinates: {
              top_left: [960, 0],
              bottom_right: [1920, 1080]
            },
            source_video_dimensions: [1920, 1080]
          }
        }
      ]
    } as unknown as Layer;

    const result = getShouldShowCropKeyFrameWarning({
      crop: ACTIVE_CROP,
      model: magoV3_4_0RenderModel,
      sources: [{ asset_id: "generated-1", type: "key_frame", index: 0 }],
      tracks: [generatedTrack]
    });

    expect(result).toBe(false);
  });

  it("does not warn for a full-frame selection", () => {
    const result = getShouldShowCropKeyFrameWarning({
      crop: { x: 0, y: 0, width: 1, height: 1 },
      model: magoV3_4_0RenderModel,
      sources: UPLOADED_REFERENCE_FRAME_SOURCE,
      tracks: []
    });

    expect(result).toBe(false);
  });
});
