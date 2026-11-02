import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { collectFailedTimelineIds } from "./collectFailedTimelineIds";

const step = (
  timelineId: string | null,
  status: string,
  toolName = "poll_shot_video_prompt"
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

describe("collectFailedTimelineIds", () => {
  it("collects a shot whose prompt adaptation failed", () => {
    const ids = collectFailedTimelineIds([
      step("shot-12", "COMPLETED", "submit_shot_video_prompt"),
      step("shot-12", "FAILED", "poll_shot_video_prompt"),
      step("shot-12", "PENDING", "create_render_layer")
    ]);

    expect([...ids]).toEqual(["shot-12"]);
  });

  it("leaves out a shot whose steps are all still going", () => {
    const ids = collectFailedTimelineIds([
      step("shot-1", "COMPLETED"),
      step("shot-2", "RUNNING"),
      step("shot-3", "PENDING"),
      step("shot-4", "SKIPPED")
    ]);

    expect(ids.size).toBe(0);
  });

  it("ignores plan-level steps that belong to no shot", () => {
    expect(collectFailedTimelineIds([step(null, "FAILED")]).size).toBe(0);
  });

  it("is empty when the steps have not loaded", () => {
    expect(collectFailedTimelineIds(undefined).size).toBe(0);
  });
});
