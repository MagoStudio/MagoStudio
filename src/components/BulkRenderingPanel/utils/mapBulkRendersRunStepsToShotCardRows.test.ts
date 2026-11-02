import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { mapBulkRendersRunStepsToShotCardRows } from "./mapBulkRendersRunStepsToShotCardRows";

const buildStep = (
  overrides: Partial<BulkRendersRunStep>
): BulkRendersRunStep => ({
  id: "step-1",
  plan_id: "run-1",
  timeline_id: "shot-1",
  step_order: 0,
  tool_name: "get_timeline_info",
  status: "PENDING",
  result: null,
  error: null,
  retry_count: 0,
  started_at: null,
  finished_at: null,
  ...overrides
});

describe("mapBulkRendersRunStepsToShotCardRows", () => {
  it("reports a still-rendering Shot as rendering", () => {
    const rows = mapBulkRendersRunStepsToShotCardRows({
      stepId: "image",
      shotIds: ["shot-1"],
      shotNameById: new Map([["shot-1", "Shot 1"]]),
      steps: [
        buildStep({
          timeline_id: "shot-1",
          tool_name: "poll_img2img",
          status: "RUNNING"
        })
      ],
      resultUrlByAssetId: new Map()
    });

    expect(rows).toEqual([
      {
        shotId: "shot-1",
        shotName: "Shot 1",
        status: "rendering",
        imageResultUrl: undefined,
        videoResultRender: undefined
      }
    ]);
  });

  it("reports a Shot that failed its quality test as failedQualityTest", () => {
    const rows = mapBulkRendersRunStepsToShotCardRows({
      stepId: "image",
      shotIds: ["shot-1"],
      shotNameById: new Map([["shot-1", "Shot 1"]]),
      steps: [
        buildStep({
          timeline_id: "shot-1",
          tool_name: "poll_img2img",
          status: "COMPLETED",
          result: { asset_id: "asset-1" }
        }),
        buildStep({
          timeline_id: "shot-1",
          tool_name: "img_quality_final",
          status: "FAILED"
        })
      ],
      resultUrlByAssetId: new Map([
        ["asset-1", "https://example.com/asset-1.png"]
      ])
    });

    expect(rows[0].status).toBe("failedQualityTest");
  });

  it("resolves the video render, so the Video step can show a frame of it", () => {
    const rows = mapBulkRendersRunStepsToShotCardRows({
      stepId: "video",
      shotIds: ["shot-1"],
      shotNameById: new Map([["shot-1", "Shot 1"]]),
      steps: [
        buildStep({
          timeline_id: "shot-1",
          tool_name: "poll_video_render",
          status: "COMPLETED",
          result: { render_asset_id: "asset-1", fps: 24 }
        })
      ],
      resultUrlByAssetId: new Map()
    });

    expect(rows[0].videoResultRender).toEqual({
      renderAssetId: "asset-1",
      renderFps: 24,
      videoUrl: undefined,
      posterUrl: undefined
    });
  });

  it("leaves the image URL alone on the Video step, so the two chains never cross", () => {
    const rows = mapBulkRendersRunStepsToShotCardRows({
      stepId: "video",
      shotIds: ["shot-1"],
      shotNameById: new Map([["shot-1", "Shot 1"]]),
      steps: [
        buildStep({
          timeline_id: "shot-1",
          tool_name: "poll_img2img",
          status: "COMPLETED",
          result: { asset_id: "asset-1" }
        })
      ],
      resultUrlByAssetId: new Map([
        ["asset-1", "https://example.com/asset-1.png"]
      ])
    });

    expect(rows[0].imageResultUrl).toBeUndefined();
  });

  it("degrades a run whose steps name an unknown tool to rendering, never crashing", () => {
    const rows = mapBulkRendersRunStepsToShotCardRows({
      stepId: "video",
      shotIds: ["shot-1"],
      shotNameById: new Map([["shot-1", "Shot 1"]]),
      steps: [
        buildStep({
          timeline_id: "shot-1",
          tool_name: "an_unknown_future_tool",
          status: "COMPLETED",
          result: { unexpected_field: "value" }
        })
      ],
      resultUrlByAssetId: new Map()
    });

    expect(rows).toEqual([
      {
        shotId: "shot-1",
        shotName: "Shot 1",
        status: "rendering",
        imageResultUrl: undefined,
        videoResultRender: undefined
      }
    ]);
  });

  it("falls back to the Shot id when no name is known", () => {
    const rows = mapBulkRendersRunStepsToShotCardRows({
      stepId: "image",
      shotIds: ["shot-1"],
      shotNameById: new Map(),
      steps: [],
      resultUrlByAssetId: new Map()
    });

    expect(rows[0].shotName).toBe("shot-1");
  });

  it("carries the resolved image URL when the asset has one", () => {
    const rows = mapBulkRendersRunStepsToShotCardRows({
      stepId: "image",
      shotIds: ["shot-1"],
      shotNameById: new Map([["shot-1", "Shot 1"]]),
      steps: [
        buildStep({
          timeline_id: "shot-1",
          tool_name: "poll_img2img",
          status: "COMPLETED",
          result: { asset_id: "asset-1" }
        })
      ],
      resultUrlByAssetId: new Map([
        ["asset-1", "https://example.com/asset-1.png"]
      ])
    });

    expect(rows[0]).toEqual({
      shotId: "shot-1",
      shotName: "Shot 1",
      status: "completed",
      imageResultUrl: "https://example.com/asset-1.png",
      videoResultRender: undefined
    });
  });

  it("reports a completed image step with a malformed result as completed with no URL", () => {
    const rows = mapBulkRendersRunStepsToShotCardRows({
      stepId: "image",
      shotIds: ["shot-1"],
      shotNameById: new Map([["shot-1", "Shot 1"]]),
      steps: [
        buildStep({
          timeline_id: "shot-1",
          tool_name: "poll_img2img",
          status: "COMPLETED",
          result: { unexpected_field: "value" }
        })
      ],
      resultUrlByAssetId: new Map()
    });

    expect(rows[0].status).toBe("completed");
    expect(rows[0].imageResultUrl).toBeUndefined();
  });

  it("reports a completed image step with a null result as completed with no URL", () => {
    const rows = mapBulkRendersRunStepsToShotCardRows({
      stepId: "image",
      shotIds: ["shot-1"],
      shotNameById: new Map([["shot-1", "Shot 1"]]),
      steps: [
        buildStep({
          timeline_id: "shot-1",
          tool_name: "poll_img2img",
          status: "COMPLETED",
          result: null
        })
      ],
      resultUrlByAssetId: new Map()
    });

    expect(rows[0].status).toBe("completed");
    expect(rows[0].imageResultUrl).toBeUndefined();
  });

  it("resolves no video render from a completed video step with a malformed result", () => {
    const rows = mapBulkRendersRunStepsToShotCardRows({
      stepId: "video",
      shotIds: ["shot-1"],
      shotNameById: new Map([["shot-1", "Shot 1"]]),
      steps: [
        buildStep({
          timeline_id: "shot-1",
          tool_name: "poll_video_render",
          status: "COMPLETED",
          result: { unexpected_field: "value" }
        })
      ],
      resultUrlByAssetId: new Map()
    });

    expect(rows[0].status).toBe("completed");
    expect(rows[0].videoResultRender).toBeUndefined();
  });

  it("never resolves a lookup miss to an inherited prototype member", () => {
    const rows = mapBulkRendersRunStepsToShotCardRows({
      stepId: "image",
      shotIds: ["constructor"],
      shotNameById: new Map(),
      steps: [
        buildStep({
          timeline_id: "constructor",
          tool_name: "poll_img2img",
          status: "COMPLETED",
          result: { asset_id: "toString" }
        })
      ],
      resultUrlByAssetId: new Map()
    });

    expect(rows[0].shotName).toBe("constructor");
    expect(rows[0].imageResultUrl).toBeUndefined();
  });
});
