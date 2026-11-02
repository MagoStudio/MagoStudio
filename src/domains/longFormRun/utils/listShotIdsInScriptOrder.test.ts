import { PlanStep } from "@schemas/plan";
import { describe, expect, it } from "vitest";

import { listShotIdsInScriptOrder } from "./listShotIdsInScriptOrder";

const step = (step_order: number, timeline_id: string | null): PlanStep =>
  ({
    id: `step-${step_order}`,
    plan_id: "shots-child",
    tool_name: "create_shot",
    status: "COMPLETED",
    step_order,
    timeline_id
  }) as PlanStep;

describe("listShotIdsInScriptOrder", () => {
  it("returns each Shot once, in step order, even when steps arrive shuffled", () => {
    const steps = [
      step(7, "shot-b"),
      step(1, "shot-a"),
      step(13, "shot-c"),
      step(2, "shot-a"),
      step(8, "shot-b")
    ];

    expect(listShotIdsInScriptOrder(steps)).toEqual([
      "shot-a",
      "shot-b",
      "shot-c"
    ]);
  });

  it("ignores steps that belong to no Shot", () => {
    const steps = [step(0, null), step(1, "shot-a"), step(2, null)];

    expect(listShotIdsInScriptOrder(steps)).toEqual(["shot-a"]);
  });

  it("is empty before the child has any steps", () => {
    expect(listShotIdsInScriptOrder([])).toEqual([]);
  });
});
