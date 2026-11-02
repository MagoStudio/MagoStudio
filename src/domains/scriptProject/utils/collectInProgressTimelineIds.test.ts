import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { collectInProgressTimelineIds } from "./collectInProgressTimelineIds";

const step = (
  timelineId: string | null,
  status: string,
  toolName = "create_render_layer"
): BulkRendersRunStep =>
  ({
    id: `step-${timelineId}-${status}-${toolName}`,
    plan_id: "plan-1",
    timeline_id: timelineId,
    step_order: 0,
    tool_name: toolName,
    status,
    result: null,
    error: null,
    retry_count: null,
    started_at: null,
    finished_at: null
  }) as unknown as BulkRendersRunStep;

describe("collectInProgressTimelineIds", () => {
  it("counts a shot whose render layer has not been created yet", () => {
    const ids = collectInProgressTimelineIds([
      step("shot-7", "COMPLETED", "shot_context"),
      step("shot-7", "PENDING", "create_render_layer")
    ]);

    expect([...ids]).toEqual(["shot-7"]);
  });

  it("counts a step the worker is running right now", () => {
    expect([
      ...collectInProgressTimelineIds([step("shot-3", "RUNNING")])
    ]).toEqual(["shot-3"]);
  });

  it("leaves out a shot whose steps have all settled", () => {
    const ids = collectInProgressTimelineIds([
      step("shot-1", "COMPLETED"),
      step("shot-2", "SKIPPED"),
      step("shot-3", "FAILED")
    ]);

    expect(ids.size).toBe(0);
  });

  it("leaves out a shot whose branch failed, however many steps sit behind it", () => {
    const ids = collectInProgressTimelineIds([
      step("shot-12", "COMPLETED", "submit_shot_video_prompt"),
      step("shot-12", "FAILED", "poll_shot_video_prompt"),
      step("shot-12", "PENDING", "create_render_layer"),
      step("shot-12", "PENDING", "submit_video_render")
    ]);

    expect(ids.size).toBe(0);
  });

  it("keeps the other shots of a plan that gave up on one of them", () => {
    const ids = collectInProgressTimelineIds([
      step("shot-12", "FAILED", "poll_shot_video_prompt"),
      step("shot-12", "PENDING", "create_render_layer"),
      step("shot-13", "RUNNING", "poll_video_render")
    ]);

    expect([...ids]).toEqual(["shot-13"]);
  });

  it("leaves out a shot whose quality evaluation failed after its render landed", () => {
    const ids = collectInProgressTimelineIds([
      step("shot-1", "COMPLETED", "poll_video_render"),
      step("shot-1", "FAILED", "submit_vid_metrics"),
      step("shot-1", "PENDING", "poll_vid_metrics")
    ]);

    expect(ids.size).toBe(0);
  });

  it("ignores plan-level steps that belong to no shot", () => {
    expect(collectInProgressTimelineIds([step(null, "PENDING")]).size).toBe(0);
  });

  it("is empty when the steps have not loaded", () => {
    expect(collectInProgressTimelineIds(undefined).size).toBe(0);
  });
});
