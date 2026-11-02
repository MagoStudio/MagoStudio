import { PlanStep, StepStatus } from "@schemas/plan";
import { describe, expect, it } from "vitest";

import {
  computeTimelineProgress,
  estimateTimelineProgressFromCounts
} from "./computeTimelineProgress";

const TIMELINE_A = "11111111-1111-1111-1111-111111111111";
const TIMELINE_B = "22222222-2222-2222-2222-222222222222";

function step(
  timelineId: string | null,
  status: StepStatus,
  order: number
): PlanStep {
  return {
    id: `${timelineId ?? "none"}-${order}`,
    plan_id: "plan-1",
    timeline_id: timelineId ?? undefined,
    step_order: order,
    tool_name: "get_timeline_info",
    status
  } as PlanStep;
}

describe("computeTimelineProgress", () => {
  it("returns zero progress for empty input", () => {
    expect(computeTimelineProgress([])).toEqual({
      completedTimelines: 0,
      totalTimelines: 0,
      completionPercent: 0
    });
  });

  it("counts a timeline as completed only when all its steps are terminal", () => {
    const steps: PlanStep[] = [
      step(TIMELINE_A, "COMPLETED", 0),
      step(TIMELINE_A, "SKIPPED", 1),
      step(TIMELINE_B, "RUNNING", 0),
      step(TIMELINE_B, "COMPLETED", 1)
    ];
    expect(computeTimelineProgress(steps)).toEqual({
      completedTimelines: 1,
      totalTimelines: 2,
      completionPercent: 50
    });
  });

  it("groups steps with missing timeline_id under a synthetic key", () => {
    const steps: PlanStep[] = [
      step(null, "COMPLETED", 0),
      step(null, "COMPLETED", 1)
    ];
    expect(computeTimelineProgress(steps)).toEqual({
      completedTimelines: 1,
      totalTimelines: 1,
      completionPercent: 100
    });
  });
});

describe("estimateTimelineProgressFromCounts", () => {
  it("estimates timeline counts using the steps-per-timeline ratio", () => {
    expect(estimateTimelineProgressFromCounts(12, 6)).toEqual({
      completedTimelines: 1,
      totalTimelines: 2,
      completionPercent: 50
    });
  });

  it("never returns less than one total timeline", () => {
    expect(estimateTimelineProgressFromCounts(0, 0).totalTimelines).toBe(1);
  });
});
