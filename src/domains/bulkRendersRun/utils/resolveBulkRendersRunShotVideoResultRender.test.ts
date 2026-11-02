import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { resolveBulkRendersRunShotVideoResultRender } from "./resolveBulkRendersRunShotVideoResultRender";

const buildStep = (
  overrides: Partial<BulkRendersRunStep>
): BulkRendersRunStep => ({
  id: "step-1",
  plan_id: "run-1",
  timeline_id: "shot-1",
  step_order: 0,
  tool_name: "submit_video_render",
  status: "COMPLETED",
  result: null,
  error: null,
  retry_count: 0,
  started_at: null,
  finished_at: null,
  ...overrides
});

describe("resolveBulkRendersRunShotVideoResultRender", () => {
  it("returns undefined when the Shot has no steps", () => {
    expect(resolveBulkRendersRunShotVideoResultRender([])).toBeUndefined();
  });

  it("reads render_asset_id from a Video step", () => {
    const resultRender = resolveBulkRendersRunShotVideoResultRender([
      buildStep({ result: { render_asset_id: "asset-1" } })
    ]);

    expect(resultRender?.renderAssetId).toBe("asset-1");
    expect(resultRender?.videoUrl).toBeUndefined();
    expect(resultRender?.posterUrl).toBeUndefined();
  });

  it("ignores render_layer_id, which is the Render Track rather than the clip asset", () => {
    const resultRender = resolveBulkRendersRunShotVideoResultRender([
      buildStep({ result: { render_layer_id: "track-1" } })
    ]);

    expect(resultRender).toBeUndefined();
  });

  it("takes the newest attempt, because the last render is the one the card shows", () => {
    const resultRender = resolveBulkRendersRunShotVideoResultRender([
      buildStep({
        step_order: 1,
        result: { render_asset_id: "asset-original" }
      }),
      buildStep({
        tool_name: "poll_vid_retry",
        step_order: 5,
        result: { render_asset_id: "asset-retry-2" }
      }),
      buildStep({
        tool_name: "poll_vid_retry",
        step_order: 3,
        result: { render_asset_id: "asset-retry-1" }
      })
    ]);

    expect(resultRender?.renderAssetId).toBe("asset-retry-2");
  });

  it("orders by step_order, not by array position", () => {
    const resultRender = resolveBulkRendersRunShotVideoResultRender([
      buildStep({ step_order: 9, result: { render_asset_id: "asset-last" } }),
      buildStep({ step_order: 1, result: { render_asset_id: "asset-first" } })
    ]);

    expect(resultRender?.renderAssetId).toBe("asset-last");
  });

  it("ignores Image chain steps", () => {
    const resultRender = resolveBulkRendersRunShotVideoResultRender([
      buildStep({
        tool_name: "poll_img2img",
        result: { render_asset_id: "asset-1" }
      })
    ]);

    expect(resultRender).toBeUndefined();
  });

  it("carries the render fps, which frame extraction requires", () => {
    const resultRender = resolveBulkRendersRunShotVideoResultRender([
      buildStep({ result: { render_asset_id: "asset-1", fps: 24 } })
    ]);

    expect(resultRender).toEqual({
      renderAssetId: "asset-1",
      renderFps: 24,
      videoUrl: undefined,
      posterUrl: undefined
    });
  });

  it("leaves the fps undefined when the step result omits it", () => {
    const resultRender = resolveBulkRendersRunShotVideoResultRender([
      buildStep({ result: { render_asset_id: "asset-1" } })
    ]);

    expect(resultRender?.renderFps).toBeUndefined();
  });

  it("uses a local script-shot poster and video without timeline asset lookups", () => {
    const resultRender = resolveBulkRendersRunShotVideoResultRender([
      buildStep({
        tool_name: "poll_video_render",
        result: {
          render_asset_id: "video-1",
          output_url: "mago-media://script-project/video-1",
          poster_asset_id: "poster-1"
        }
      })
    ]);

    expect(resultRender).toEqual({
      renderAssetId: "video-1",
      renderFps: undefined,
      videoUrl: "mago-media://script-project/video-1",
      posterUrl: "mago-media://script-project/poster-1"
    });
  });

  it("does not trust cloud output URLs in place of refreshed asset URLs", () => {
    const resultRender = resolveBulkRendersRunShotVideoResultRender([
      buildStep({
        result: {
          render_asset_id: "asset-1",
          output_url: "https://expired.example/video.mp4",
          poster_url: "https://expired.example/poster.jpg"
        }
      })
    ]);

    expect(resultRender?.videoUrl).toBeUndefined();
    expect(resultRender?.posterUrl).toBeUndefined();
  });
});
