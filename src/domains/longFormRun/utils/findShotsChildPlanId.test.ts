import { PlanStep } from "@schemas/plan";
import { describe, expect, it } from "vitest";

import { findShotsChildPlanId } from "./findShotsChildPlanId";

const step = (
  overrides: Partial<PlanStep> & { step_order: number }
): PlanStep =>
  ({
    id: `step-${overrides.step_order}`,
    plan_id: "parent",
    tool_name: "create_project",
    status: "COMPLETED",
    ...overrides
  }) as PlanStep;

describe("findShotsChildPlanId", () => {
  it("returns the child id of the spawn step whose kind is shots", () => {
    const steps = [
      step({ step_order: 0, tool_name: "create_project" }),
      step({
        step_order: 14,
        tool_name: "spawn_scenario_child",
        tool_args: { kind: "shots" },
        result: { child_plan_id: "shots-child" }
      })
    ];

    expect(findShotsChildPlanId(steps)).toBe("shots-child");
  });

  it("ignores a sheets spawn step from the older plan shape", () => {
    const steps = [
      step({
        step_order: 8,
        tool_name: "spawn_scenario_child",
        tool_args: { kind: "shots" },
        result: { child_plan_id: "shots-child" }
      }),
      step({
        step_order: 4,
        tool_name: "spawn_scenario_child",
        tool_args: { kind: "sheets" },
        result: { child_plan_id: "sheets-child" }
      })
    ];

    expect(findShotsChildPlanId(steps)).toBe("shots-child");
  });

  it("is undefined while the shots child has not spawned yet", () => {
    const steps = [
      step({
        step_order: 14,
        tool_name: "spawn_scenario_child",
        tool_args: { kind: "shots" },
        status: "PENDING"
      })
    ];

    expect(findShotsChildPlanId(steps)).toBeUndefined();
  });

  it("is undefined when the spawn result carries no string id", () => {
    const steps = [
      step({
        step_order: 14,
        tool_name: "spawn_scenario_child",
        tool_args: { kind: "shots" },
        result: { child_plan_id: null }
      })
    ];

    expect(findShotsChildPlanId(steps)).toBeUndefined();
  });

  it("is undefined when a spawn step declares no kind", () => {
    const steps = [
      step({
        step_order: 14,
        tool_name: "spawn_scenario_child",
        result: { child_plan_id: "unknown-child" }
      })
    ];

    expect(findShotsChildPlanId(steps)).toBeUndefined();
  });
});
