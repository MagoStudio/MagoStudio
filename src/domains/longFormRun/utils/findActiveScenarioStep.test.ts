import { PlanStep } from "@schemas/plan";
import { describe, expect, it } from "vitest";

import { findActiveScenarioStep } from "./findActiveScenarioStep";

const buildStep = (overrides: Partial<PlanStep>): PlanStep => ({
  id: "00000000-0000-0000-0000-000000000000",
  plan_id: "00000000-0000-0000-0000-000000000000",
  step_order: 0,
  tool_name: "create_project",
  status: "PENDING",
  ...overrides
});

describe("findActiveScenarioStep", () => {
  it("picks the RUNNING step when one exists", () => {
    const runningStep = buildStep({
      step_order: 4,
      tool_name: "spawn_scenario_child",
      status: "RUNNING"
    });
    const steps = [
      buildStep({
        step_order: 3,
        tool_name: "plan_scenario_shots",
        status: "COMPLETED"
      }),
      runningStep
    ];

    expect(findActiveScenarioStep(steps)).toBe(runningStep);
  });

  it("picks a parked PENDING step that already has a started_at, when nothing is RUNNING", () => {
    const parkedStep = buildStep({
      step_order: 2,
      tool_name: "poll_script_casting",
      status: "PENDING",
      started_at: "2026-09-02T00:00:00Z"
    });
    const steps = [
      buildStep({
        step_order: 1,
        tool_name: "submit_script_casting",
        status: "COMPLETED"
      }),
      parkedStep,
      buildStep({
        step_order: 3,
        tool_name: "plan_scenario_shots",
        status: "PENDING"
      })
    ];

    expect(findActiveScenarioStep(steps)).toBe(parkedStep);
  });

  it("falls back to the most recent COMPLETED step when nothing is RUNNING or a started PENDING", () => {
    const laterCompletedStep = buildStep({
      step_order: 3,
      tool_name: "plan_scenario_shots",
      status: "COMPLETED"
    });
    const steps = [
      buildStep({
        step_order: 1,
        tool_name: "submit_script_casting",
        status: "COMPLETED"
      }),
      laterCompletedStep,
      buildStep({
        step_order: 4,
        tool_name: "spawn_scenario_child",
        status: "PENDING"
      })
    ];

    expect(findActiveScenarioStep(steps)).toBe(laterCompletedStep);
  });

  it("returns undefined when no step is RUNNING, started-PENDING, or COMPLETED", () => {
    const steps = [
      buildStep({
        step_order: 0,
        tool_name: "create_project",
        status: "PENDING"
      })
    ];

    expect(findActiveScenarioStep(steps)).toBeUndefined();
  });
});
