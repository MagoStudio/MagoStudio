import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { resolveBulkRendersRunShotResultAssetId } from "./resolveBulkRendersRunShotResultAssetId";

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

describe("resolveBulkRendersRunShotResultAssetId", () => {
  it("resolves the quality-final asset when a Shot passed quality on the first attempt", () => {
    const assetId = resolveBulkRendersRunShotResultAssetId([
      buildStep({
        tool_name: "poll_img2img",
        status: "COMPLETED",
        result: { asset_id: "initial-render-asset" }
      }),
      buildStep({
        tool_name: "img_quality_final",
        status: "COMPLETED",
        result: { asset_id: "quality-final-asset" }
      })
    ]);

    expect(assetId).toBe("quality-final-asset");
  });

  it("prefers the quality-final asset over a rejected initial render", () => {
    const assetId = resolveBulkRendersRunShotResultAssetId([
      buildStep({
        tool_name: "poll_img2img",
        status: "COMPLETED",
        result: { asset_id: "rejected-initial-asset" }
      }),
      buildStep({
        tool_name: "img_quality_final",
        status: "COMPLETED",
        result: { asset_id: "retried-asset" }
      })
    ]);

    expect(assetId).toBe("retried-asset");
  });

  it("falls back to the initial render when no quality gate ran", () => {
    const assetId = resolveBulkRendersRunShotResultAssetId([
      buildStep({
        tool_name: "poll_img2img",
        status: "COMPLETED",
        result: { asset_id: "initial-render-asset" }
      })
    ]);

    expect(assetId).toBe("initial-render-asset");
  });

  it("resolves the supplied frame's asset when the user supplied the Shot's frame", () => {
    const assetId = resolveBulkRendersRunShotResultAssetId([
      buildStep({
        tool_name: "use_provided_reference_frame",
        status: "COMPLETED",
        result: { asset_id: "supplied-frame-asset" }
      })
    ]);

    expect(assetId).toBe("supplied-frame-asset");
  });

  it("resolves to no image when the completed step's result shape is unrecognised", () => {
    const assetId = resolveBulkRendersRunShotResultAssetId([
      buildStep({
        tool_name: "poll_img2img",
        status: "COMPLETED",
        result: { unexpected_field: "value" }
      })
    ]);

    expect(assetId).toBeUndefined();
  });

  it("resolves to no image when no relevant step has completed", () => {
    const assetId = resolveBulkRendersRunShotResultAssetId([
      buildStep({ tool_name: "poll_img2img", status: "RUNNING" })
    ]);

    expect(assetId).toBeUndefined();
  });
});
