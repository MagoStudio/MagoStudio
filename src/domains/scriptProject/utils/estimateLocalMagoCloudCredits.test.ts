import { ProjectCut } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { MINIMAX_H3_MAX_SHOT_RENDER_ENGINE } from "../constants";

import { estimateLocalMagoCloudCredits } from "./estimateLocalMagoCloudCredits";
import { estimateShotRenderCredits } from "./estimateShotRenderCredits";
import { snapShotSecondsToFrames } from "./snapShotFrames";

describe("estimateLocalMagoCloudCredits", () => {
  it("totals completed generations and excludes timeline upscales", () => {
    const version = (assetId: string, timelineUpscaleOf?: string) => ({
      layer_id: `layer-${assetId}`,
      asset_id: assetId,
      ready: true,
      status: "available",
      url: `mago-media://script-project/${assetId}`,
      poster_url: null,
      timeline_upscale_of: timelineUpscaleOf,
      input_settings: { output_size: [1280, 720], duration_s: 5 }
    });
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
          url: "mago-media://script-project/video-1",
          poster_url: null,
          versions: [version("video-1"), version("upscale", "video-1")]
        }
      ]
    } satisfies ProjectCut;

    expect(estimateLocalMagoCloudCredits(cut)).toBe(
      estimateShotRenderCredits({
        shotEngine: MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
        outputSize: [1280, 720],
        shotFrames: snapShotSecondsToFrames(5),
        referenceImageSizes: []
      })
    );
  });

  it("uses fallback input settings when the render spec omits duration", () => {
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
          url: "mago-media://script-project/video-1",
          poster_url: null,
          versions: [
            {
              layer_id: "layer-video-1",
              asset_id: "video-1",
              ready: true,
              status: "available",
              url: "mago-media://script-project/video-1",
              poster_url: null,
              render_spec: { output_size: [1280, 720], settings: {} },
              input_settings: { output_size: [1280, 720], duration_s: 6 }
            }
          ]
        }
      ]
    } satisfies ProjectCut;

    expect(estimateLocalMagoCloudCredits(cut)).toBe(
      estimateShotRenderCredits({
        shotEngine: MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
        outputSize: [1280, 720],
        shotFrames: snapShotSecondsToFrames(6),
        referenceImageSizes: []
      })
    );
  });
});
