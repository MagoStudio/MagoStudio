import { ProjectCut, ProjectState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { UNRECORDED_RENDER_SHOT_RENDER_ENGINE } from "../constants";

import { estimateCloudRenderCredits } from "./estimateCloudRenderCredits";
import { estimateSheetImageCredits } from "./estimateSheetImageCredits";
import { estimateShotRenderCredits } from "./estimateShotRenderCredits";
import { snapShotSecondsToFrames } from "./snapShotFrames";

const state = {
  project_id: "project-1",
  sheets_timeline_id: null,
  sequential_prompt_defaults: null,
  shots: [],
  keys: [
    {
      token: "hero",
      name: "Hero",
      layer_id: "layer-1",
      layer_order: 0,
      selected_asset_id: "image-1",
      effective_asset_id: "image-1",
      effective_source: "render",
      enabled: true,
      images: [
        {
          asset_id: "image-1",
          clip_id: "clip-1",
          status: "success",
          source: "render",
          url: "https://example.test/image.png",
          thumbnail_url: null,
          has_description: false,
          input_settings: {
            render_model: "seedream_5_pro_t2i",
            output_size: [1280, 720]
          }
        }
      ]
    }
  ]
} satisfies ProjectState;

const cut = {
  project_id: "project-1",
  hidden_shots: [],
  missing: [],
  missing_timeline_ids: [],
  export: null,
  shots: [
    {
      timeline_id: "shot-1",
      shot_index: 0,
      sequence_id: 1,
      asset_id: "video-1",
      pinned_asset_id: "video-1",
      is_upscale: false,
      url: "https://example.test/video.mp4",
      poster_url: null,
      versions: [
        {
          layer_id: "video-layer",
          asset_id: "video-1",
          ready: true,
          status: "success",
          url: "https://example.test/video.mp4",
          poster_url: null,
          input_settings: { output_size: [1280, 720], duration_s: 5 }
        }
      ]
    }
  ]
} satisfies ProjectCut;

describe("estimateCloudRenderCredits", () => {
  it("estimates completed sheet and video versions from frozen settings", () => {
    expect(estimateCloudRenderCredits(state, cut, "cloud")).toBe(
      estimateSheetImageCredits("seedream_5_pro_t2i", [1280, 720]) +
        estimateShotRenderCredits({
          shotEngine: UNRECORDED_RENDER_SHOT_RENDER_ENGINE,
          outputSize: [1280, 720],
          shotFrames: snapShotSecondsToFrames(5),
          referenceImageSizes: []
        })
    );
  });

  it("does not mistake local videos for cloud usage", () => {
    expect(estimateCloudRenderCredits(state, cut, "local")).toBe(
      estimateSheetImageCredits("seedream_5_pro_t2i", [1280, 720])
    );
  });
});
