import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { deriveBulkRendersRunShotImageCardState } from "./deriveBulkRendersRunShotImageCardState";

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

describe("deriveBulkRendersRunShotImageCardState", () => {
  it("is pending when no Image step has started", () => {
    const state = deriveBulkRendersRunShotImageCardState([
      buildStep({ tool_name: "submit_img2img", status: "PENDING" })
    ]);

    expect(state).toBe("pending");
  });

  it("is pending when the Shot has no steps at all", () => {
    expect(deriveBulkRendersRunShotImageCardState([])).toBe("pending");
  });

  it("is rendering while an Image step is running", () => {
    const state = deriveBulkRendersRunShotImageCardState([
      buildStep({ tool_name: "submit_img2img", status: "COMPLETED" }),
      buildStep({ tool_name: "poll_img2img", status: "RUNNING" })
    ]);

    expect(state).toBe("rendering");
  });

  it("is ready once every Image step has completed", () => {
    const state = deriveBulkRendersRunShotImageCardState([
      buildStep({ tool_name: "submit_img2img", status: "COMPLETED" }),
      buildStep({ tool_name: "poll_img2img", status: "COMPLETED" }),
      buildStep({ tool_name: "img_quality_gate", status: "SKIPPED" })
    ]);

    expect(state).toBe("ready");
  });

  it("is a quality failure when the quality-final step has failed", () => {
    const state = deriveBulkRendersRunShotImageCardState([
      buildStep({ tool_name: "poll_img2img", status: "COMPLETED" }),
      buildStep({ tool_name: "img_quality_final", status: "FAILED" })
    ]);

    expect(state).toBe("qualityFailure");
  });

  it("is a quality failure when a quality retry has failed", () => {
    const state = deriveBulkRendersRunShotImageCardState([
      buildStep({ tool_name: "poll_img2img", status: "COMPLETED" }),
      buildStep({ tool_name: "poll_img_retry", status: "FAILED" })
    ]);

    expect(state).toBe("qualityFailure");
  });

  it("is an infrastructure failure for any other failed Image step", () => {
    const state = deriveBulkRendersRunShotImageCardState([
      buildStep({ tool_name: "submit_img2img", status: "FAILED" })
    ]);

    expect(state).toBe("infrastructureFailure");
  });

  it("ignores steps whose tool name is not part of the Image chain", () => {
    const state = deriveBulkRendersRunShotImageCardState([
      buildStep({ tool_name: "an_unknown_future_tool", status: "FAILED" })
    ]);

    expect(state).toBe("pending");
  });
});
