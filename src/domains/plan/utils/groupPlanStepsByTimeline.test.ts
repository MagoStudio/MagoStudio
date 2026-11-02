import { PlanStep, StepStatus } from "@schemas/plan";
import { describe, expect, it } from "vitest";

import {
  groupPlanStepsByTimeline,
  summarizeTimelineSteps
} from "./groupPlanStepsByTimeline";

const TIMELINE_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const TIMELINE_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

function step(
  timelineId: string | null,
  status: StepStatus,
  order: number
): PlanStep {
  return {
    id: `${timelineId ?? "no-tl"}-${order}`,
    plan_id: "plan-1",
    timeline_id: timelineId ?? undefined,
    step_order: order,
    tool_name: "get_timeline_info",
    status
  } as PlanStep;
}

describe("groupPlanStepsByTimeline", () => {
  it("groups steps by timeline id", () => {
    const groups = groupPlanStepsByTimeline([
      step(TIMELINE_A, "RUNNING", 0),
      step(TIMELINE_A, "PENDING", 1),
      step(TIMELINE_B, "COMPLETED", 0)
    ]);
    expect(groups.get(TIMELINE_A)).toHaveLength(2);
    expect(groups.get(TIMELINE_B)).toHaveLength(1);
  });
});

describe("summarizeTimelineSteps", () => {
  it("returns 'running' when any step is RUNNING", () => {
    expect(
      summarizeTimelineSteps([
        step(TIMELINE_A, "RUNNING", 0),
        step(TIMELINE_A, "PENDING", 1)
      ])
    ).toMatchObject({ kind: "running", completed: 0, total: 2 });
  });

  it("returns 'failed' when any step is FAILED and none are running", () => {
    expect(
      summarizeTimelineSteps([
        step(TIMELINE_A, "COMPLETED", 0),
        step(TIMELINE_A, "FAILED", 1)
      ])
    ).toMatchObject({ kind: "failed", completed: 1, total: 2 });
  });

  it("returns 'done' when all steps are terminal", () => {
    expect(
      summarizeTimelineSteps([
        step(TIMELINE_A, "COMPLETED", 0),
        step(TIMELINE_A, "SKIPPED", 1)
      ])
    ).toMatchObject({ kind: "done", completed: 2, total: 2 });
  });

  it("returns 'pending' otherwise", () => {
    expect(
      summarizeTimelineSteps([
        step(TIMELINE_A, "PENDING", 0),
        step(TIMELINE_A, "PENDING", 1)
      ])
    ).toMatchObject({ kind: "pending", completed: 0, total: 2 });
  });
});
