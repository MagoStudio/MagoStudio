import { describe, expect, it } from "vitest";

import { withUnfinishedSequentialDependents } from "./withUnfinishedSequentialDependents";

const barrier = (
  timelineId: string,
  previousTimelineId: string,
  status: string
) => ({
  tool_name: "poll_prev_shot_complete",
  timeline_id: timelineId,
  status,
  tool_args: { prev_timeline_id: previousTimelineId }
});

const shotStep = (timelineId: string, status: string) => ({
  tool_name: "shot_context",
  timeline_id: timelineId,
  status
});

describe("withUnfinishedSequentialDependents", () => {
  it("adds every unfinished shot chained after a superseded shot", () => {
    const planSteps = [
      shotStep("A", "PENDING"),
      barrier("B", "A", "PENDING"),
      shotStep("B", "PENDING"),
      barrier("C", "B", "PENDING"),
      shotStep("C", "PENDING")
    ];

    expect(
      withUnfinishedSequentialDependents({
        planSteps,
        supersededTimelineIds: new Set(["A"])
      })
    ).toEqual(new Set(["A", "B", "C"]));
  });

  it("leaves a finished dependent and shots that do not chain from it", () => {
    const planSteps = [
      shotStep("A", "FAILED"),
      barrier("B", "A", "COMPLETED"),
      shotStep("B", "COMPLETED"),
      shotStep("D", "PENDING")
    ];

    expect(
      withUnfinishedSequentialDependents({
        planSteps,
        supersededTimelineIds: new Set(["A"])
      })
    ).toEqual(new Set(["A"]));
  });
});
