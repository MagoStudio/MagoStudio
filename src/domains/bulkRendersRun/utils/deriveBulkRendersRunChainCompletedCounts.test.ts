import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { deriveBulkRendersRunChainCompletedCounts } from "./deriveBulkRendersRunChainCompletedCounts";

const buildStep = (overrides: {
  timelineId: string;
  toolName: string;
  status: BulkRendersRunStep["status"];
}): BulkRendersRunStep => ({
  id: `${overrides.timelineId}-${overrides.toolName}`,
  plan_id: "plan-1",
  timeline_id: overrides.timelineId,
  step_order: 0,
  tool_name: overrides.toolName,
  status: overrides.status,
  result: null,
  error: null,
  retry_count: null,
  started_at: null,
  finished_at: null
});

describe("deriveBulkRendersRunChainCompletedCounts", () => {
  it("ignores an unknown tool name for both chains", () => {
    const steps = [
      buildStep({
        timelineId: "shot-1",
        toolName: "some_future_tool",
        status: "COMPLETED"
      })
    ];

    const counts = deriveBulkRendersRunChainCompletedCounts({
      shotIds: ["shot-1"],
      steps
    });

    expect(counts).toEqual({
      imageChainCompletedCount: 0,
      videoChainCompletedCount: 0
    });
  });

  it("counts zero for both chains on a run with no steps yet", () => {
    const counts = deriveBulkRendersRunChainCompletedCounts({
      shotIds: ["shot-1", "shot-2"],
      steps: []
    });

    expect(counts).toEqual({
      imageChainCompletedCount: 0,
      videoChainCompletedCount: 0
    });
  });

  it("counts only the Shots whose chain has fully completed on a partially complete run", () => {
    const steps = [
      buildStep({
        timelineId: "shot-done",
        toolName: "poll_img2img",
        status: "COMPLETED"
      }),
      buildStep({
        timelineId: "shot-done",
        toolName: "img_quality_final",
        status: "COMPLETED"
      }),
      buildStep({
        timelineId: "shot-in-progress",
        toolName: "poll_img2img",
        status: "RUNNING"
      })
    ];

    const counts = deriveBulkRendersRunChainCompletedCounts({
      shotIds: ["shot-done", "shot-in-progress"],
      steps
    });

    expect(counts).toEqual({
      imageChainCompletedCount: 1,
      videoChainCompletedCount: 0
    });
  });
});
