import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { resolveBulkRendersRunShotVideoReferenceFrameAssetId } from "./resolveBulkRendersRunShotVideoReferenceFrameAssetId";

const buildStep = (
  overrides: Partial<BulkRendersRunStep>
): BulkRendersRunStep => ({
  id: "step-1",
  plan_id: "run-1",
  timeline_id: "shot-1",
  step_order: 0,
  tool_name: "poll_video_render",
  status: "COMPLETED",
  result: null,
  error: null,
  retry_count: 0,
  started_at: null,
  finished_at: null,
  ...overrides
});

describe("resolveBulkRendersRunShotVideoReferenceFrameAssetId", () => {
  it("returns undefined when the Shot has no steps", () => {
    expect(
      resolveBulkRendersRunShotVideoReferenceFrameAssetId([])
    ).toBeUndefined();
  });

  it("reads ref_frame_asset_id from a Video step", () => {
    const assetId = resolveBulkRendersRunShotVideoReferenceFrameAssetId([
      buildStep({ result: { ref_frame_asset_id: "frame-asset-1" } })
    ]);

    expect(assetId).toBe("frame-asset-1");
  });

  it("takes the earliest Video step that carries it, so retries cannot change the reference frame", () => {
    const assetId = resolveBulkRendersRunShotVideoReferenceFrameAssetId([
      buildStep({
        tool_name: "poll_vid_retry",
        step_order: 5,
        result: { ref_frame_asset_id: "frame-asset-late" }
      }),
      buildStep({
        step_order: 1,
        result: { ref_frame_asset_id: "frame-asset-early" }
      })
    ]);

    expect(assetId).toBe("frame-asset-early");
  });

  it("ignores Image chain steps", () => {
    const assetId = resolveBulkRendersRunShotVideoReferenceFrameAssetId([
      buildStep({
        tool_name: "poll_img2img",
        result: { ref_frame_asset_id: "frame-asset-1" }
      })
    ]);

    expect(assetId).toBeUndefined();
  });

  it("reads it from a step that has not completed, because it is an input rather than a result", () => {
    const assetId = resolveBulkRendersRunShotVideoReferenceFrameAssetId([
      buildStep({
        tool_name: "submit_vid_metrics",
        status: "RUNNING",
        result: { ref_frame_asset_id: "frame-asset-1" }
      })
    ]);

    expect(assetId).toBe("frame-asset-1");
  });
});
