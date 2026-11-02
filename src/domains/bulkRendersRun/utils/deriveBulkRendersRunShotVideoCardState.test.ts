import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { deriveBulkRendersRunShotVideoCardState } from "./deriveBulkRendersRunShotVideoCardState";

const buildStep = (
  overrides: Partial<BulkRendersRunStep>
): BulkRendersRunStep => ({
  id: "step-1",
  plan_id: "run-1",
  timeline_id: "shot-1",
  step_order: 0,
  tool_name: "create_render_layer",
  status: "PENDING",
  result: null,
  error: null,
  retry_count: 0,
  started_at: null,
  finished_at: null,
  ...overrides
});

const buildVideoMetricsStep = ({
  stepOrder,
  status,
  metricsStatus,
  didPassQuality
}: {
  stepOrder: number;
  status?: BulkRendersRunStep["status"];
  metricsStatus?: string;
  didPassQuality?: boolean;
}): BulkRendersRunStep =>
  buildStep({
    tool_name: "poll_vid_metrics",
    step_order: stepOrder,
    status: status ?? "COMPLETED",
    result: {
      status: "success",
      video_metrics: {
        status: metricsStatus ?? "COMPLETED",
        vid_pass: didPassQuality
      }
    }
  });

describe("deriveBulkRendersRunShotVideoCardState", () => {
  it("is pending when the Shot has no steps at all", () => {
    expect(deriveBulkRendersRunShotVideoCardState([])).toBe("pending");
  });

  it("is pending when the Shot has only Image steps", () => {
    const state = deriveBulkRendersRunShotVideoCardState([
      buildStep({ tool_name: "poll_img2img", status: "COMPLETED" })
    ]);

    expect(state).toBe("pending");
  });

  it("is pending when no Video step has started", () => {
    const state = deriveBulkRendersRunShotVideoCardState([
      buildStep({ tool_name: "create_render_layer", status: "PENDING" })
    ]);

    expect(state).toBe("pending");
  });

  it("is rendering while a Video step is running", () => {
    const state = deriveBulkRendersRunShotVideoCardState([
      buildStep({ tool_name: "create_render_layer", status: "COMPLETED" }),
      buildStep({ tool_name: "poll_video_render", status: "RUNNING" })
    ]);

    expect(state).toBe("rendering");
  });

  it("is ready once every Video step is done and the quality test passed", () => {
    const state = deriveBulkRendersRunShotVideoCardState([
      buildStep({ tool_name: "poll_video_render", status: "COMPLETED" }),
      buildVideoMetricsStep({ stepOrder: 1, didPassQuality: true }),
      buildStep({ tool_name: "vid_quality_gate", status: "SKIPPED" })
    ]);

    expect(state).toBe("ready");
  });

  describe("infrastructure failure — any failed step, whatever the tool", () => {
    it("covers the render submit", () => {
      const state = deriveBulkRendersRunShotVideoCardState([
        buildStep({ tool_name: "submit_video_render", status: "FAILED" })
      ]);

      expect(state).toBe("infrastructureFailure");
    });

    it("covers the quality gate, which fails only when it cannot spawn the retry", () => {
      const state = deriveBulkRendersRunShotVideoCardState([
        buildStep({ tool_name: "poll_video_render", status: "COMPLETED" }),
        buildStep({ tool_name: "vid_quality_gate", status: "FAILED" })
      ]);

      expect(state).toBe("infrastructureFailure");
    });

    it("covers the retry poll, which fails when the retry render itself failed", () => {
      const state = deriveBulkRendersRunShotVideoCardState([
        buildStep({ tool_name: "poll_vid_retry", status: "FAILED" })
      ]);

      expect(state).toBe("infrastructureFailure");
    });

    it("beats a failed quality test, because a broken run is the more urgent fact", () => {
      const state = deriveBulkRendersRunShotVideoCardState([
        buildVideoMetricsStep({ stepOrder: 1, didPassQuality: false }),
        buildStep({
          tool_name: "poll_vid_retry",
          step_order: 3,
          status: "FAILED"
        })
      ]);

      expect(state).toBe("infrastructureFailure");
    });

    it("treats a failed step as terminal, never as still retrying", () => {
      const state = deriveBulkRendersRunShotVideoCardState([
        buildStep({ tool_name: "vid_quality_gate", status: "FAILED" }),
        buildStep({ tool_name: "poll_vid_retry", status: "PENDING" })
      ]);

      expect(state).toBe("infrastructureFailure");
    });
  });

  describe("quality failure — the metrics reported a fail", () => {
    it("fires when the last evaluated attempt did not pass", () => {
      const state = deriveBulkRendersRunShotVideoCardState([
        buildStep({ tool_name: "poll_video_render", status: "COMPLETED" }),
        buildVideoMetricsStep({ stepOrder: 1, didPassQuality: false })
      ]);

      expect(state).toBe("qualityFailure");
    });

    it("reads the highest step_order attempt, not the first in the array", () => {
      const state = deriveBulkRendersRunShotVideoCardState([
        buildVideoMetricsStep({ stepOrder: 5, didPassQuality: true }),
        buildVideoMetricsStep({ stepOrder: 1, didPassQuality: false })
      ]);

      expect(state).toBe("ready");
    });

    it("fires when a passing attempt is followed by a failing retry", () => {
      const state = deriveBulkRendersRunShotVideoCardState([
        buildVideoMetricsStep({ stepOrder: 1, didPassQuality: true }),
        buildVideoMetricsStep({ stepOrder: 5, didPassQuality: false })
      ]);

      expect(state).toBe("qualityFailure");
    });

    it("ignores a skipped attempt when picking the last evaluated one", () => {
      const state = deriveBulkRendersRunShotVideoCardState([
        buildVideoMetricsStep({ stepOrder: 1, didPassQuality: false }),
        buildVideoMetricsStep({
          stepOrder: 5,
          status: "SKIPPED",
          didPassQuality: true
        })
      ]);

      expect(state).toBe("qualityFailure");
    });

    it("does not fire when the evaluation itself failed, because quality was never judged", () => {
      const state = deriveBulkRendersRunShotVideoCardState([
        buildStep({ tool_name: "poll_video_render", status: "COMPLETED" }),
        buildVideoMetricsStep({
          stepOrder: 1,
          metricsStatus: "FAILED",
          didPassQuality: undefined
        })
      ]);

      expect(state).toBe("ready");
    });

    it("does not fire when the result carries no vid_pass at all", () => {
      const state = deriveBulkRendersRunShotVideoCardState([
        buildStep({ tool_name: "poll_video_render", status: "COMPLETED" }),
        buildStep({
          tool_name: "poll_vid_metrics",
          step_order: 1,
          status: "COMPLETED",
          result: { status: "success" }
        })
      ]);

      expect(state).toBe("ready");
    });
  });

  it("reads Done when the metrics submit crashed after the render finished, because the video exists", () => {
    const cardState = deriveBulkRendersRunShotVideoCardState([
      buildStep({
        step_order: 14,
        tool_name: "create_render_layer",
        status: "COMPLETED"
      }),
      buildStep({
        step_order: 15,
        tool_name: "submit_video_render",
        status: "COMPLETED",
        result: { render_asset_id: "asset-1" }
      }),
      buildStep({
        step_order: 16,
        tool_name: "poll_video_render",
        status: "COMPLETED",
        result: { status: "FINISHED", render_asset_id: "asset-1" }
      }),
      buildStep({
        step_order: 17,
        tool_name: "submit_vid_metrics",
        status: "FAILED",
        error: { message: "ffmpeg frame extraction failed (rc=234)" }
      }),
      buildStep({
        step_order: 18,
        tool_name: "poll_vid_metrics",
        status: "PENDING"
      }),
      buildStep({
        step_order: 19,
        tool_name: "vid_quality_gate",
        status: "PENDING"
      })
    ]);

    expect(cardState).toBe("ready");
  });

  it("does not sit on rendering when a metrics crash leaves later steps unrun", () => {
    const cardState = deriveBulkRendersRunShotVideoCardState([
      buildStep({
        step_order: 16,
        tool_name: "poll_video_render",
        status: "COMPLETED",
        result: { status: "FINISHED", render_asset_id: "asset-1" }
      }),
      buildStep({
        step_order: 17,
        tool_name: "submit_vid_metrics",
        status: "FAILED"
      }),
      buildStep({
        step_order: 26,
        tool_name: "poll_vid_metrics",
        status: "PENDING"
      })
    ]);

    expect(cardState).not.toBe("rendering");
  });

  it("still reads an infrastructure failure when the render itself failed", () => {
    const cardState = deriveBulkRendersRunShotVideoCardState([
      buildStep({
        step_order: 15,
        tool_name: "submit_video_render",
        status: "COMPLETED"
      }),
      buildStep({
        step_order: 16,
        tool_name: "poll_video_render",
        status: "FAILED"
      })
    ]);

    expect(cardState).toBe("infrastructureFailure");
  });

  it("still reads an infrastructure failure when the quality gate could not spawn the retry", () => {
    const cardState = deriveBulkRendersRunShotVideoCardState([
      buildStep({
        step_order: 16,
        tool_name: "poll_video_render",
        status: "COMPLETED",
        result: { status: "FINISHED", render_asset_id: "asset-1" }
      }),
      buildStep({
        step_order: 19,
        tool_name: "vid_quality_gate",
        status: "FAILED"
      })
    ]);

    expect(cardState).toBe("infrastructureFailure");
  });

  it("still reads an infrastructure failure when the retry render broke", () => {
    const cardState = deriveBulkRendersRunShotVideoCardState([
      buildStep({
        step_order: 16,
        tool_name: "poll_video_render",
        status: "COMPLETED",
        result: { status: "FINISHED", render_asset_id: "asset-1" }
      }),
      buildStep({
        step_order: 20,
        tool_name: "poll_vid_retry",
        status: "FAILED"
      })
    ]);

    expect(cardState).toBe("infrastructureFailure");
  });

  it("still reads an infrastructure failure when the Render Track could not be created", () => {
    const cardState = deriveBulkRendersRunShotVideoCardState([
      buildStep({
        step_order: 14,
        tool_name: "create_render_layer",
        status: "FAILED"
      })
    ]);

    expect(cardState).toBe("infrastructureFailure");
  });

  it("keeps a recorded quality failure even when a later metrics step crashed", () => {
    const cardState = deriveBulkRendersRunShotVideoCardState([
      buildStep({
        step_order: 16,
        tool_name: "poll_video_render",
        status: "COMPLETED",
        result: { status: "FINISHED", render_asset_id: "asset-1" }
      }),
      buildStep({
        step_order: 18,
        tool_name: "poll_vid_metrics",
        status: "COMPLETED",
        result: { video_metrics: { status: "COMPLETED", vid_pass: false } }
      }),
      buildStep({
        step_order: 21,
        tool_name: "submit_vid_metrics",
        status: "FAILED"
      })
    ]);

    expect(cardState).toBe("qualityFailure");
  });
});
