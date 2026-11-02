import { PlanStep } from "@schemas/plan";
import { describe, expect, it } from "vitest";

import { deriveScenarioRunPhase } from "./deriveScenarioRunPhase";

const buildStep = (overrides: Partial<PlanStep>): PlanStep => ({
  id: "00000000-0000-0000-0000-000000000000",
  plan_id: "00000000-0000-0000-0000-000000000000",
  step_order: 0,
  tool_name: "create_project",
  status: "RUNNING",
  ...overrides
});

describe("deriveScenarioRunPhase", () => {
  it("returns undefined when there is no active step", () => {
    expect(deriveScenarioRunPhase(undefined)).toBeUndefined();
  });

  it("reports reading the script for the casting submit or poll step", () => {
    expect(
      deriveScenarioRunPhase(
        buildStep({ step_order: 2, tool_name: "submit_script_casting" })
      )
    ).toBe("readingScript");
    expect(
      deriveScenarioRunPhase(
        buildStep({ step_order: 3, tool_name: "poll_script_casting" })
      )
    ).toBe("readingScript");
  });

  it("reports planning the shots for plan_scenario_shots", () => {
    expect(
      deriveScenarioRunPhase(
        buildStep({ step_order: 4, tool_name: "plan_scenario_shots" })
      )
    ).toBe("planningShots");
  });

  it("reports drawing the cast and sets for the sheet batch steps and their gate", () => {
    expect(
      deriveScenarioRunPhase(
        buildStep({ step_order: 6, tool_name: "submit_img2img_batch" })
      )
    ).toBe("drawingCastAndSets");
    expect(
      deriveScenarioRunPhase(
        buildStep({ step_order: 7, tool_name: "poll_img2img_batch" })
      )
    ).toBe("drawingCastAndSets");
    expect(
      deriveScenarioRunPhase(
        buildStep({ step_order: 11, tool_name: "batch_complete_gate" })
      )
    ).toBe("drawingCastAndSets");
  });

  it("reports preparing references for the stitch submit and poll steps", () => {
    expect(
      deriveScenarioRunPhase(
        buildStep({ step_order: 12, tool_name: "submit_stitch_sheets" })
      )
    ).toBe("preparingReferences");
    expect(
      deriveScenarioRunPhase(
        buildStep({ step_order: 13, tool_name: "poll_stitch_sheets" })
      )
    ).toBe("preparingReferences");
  });

  it("reports rendering the shots for the child spawn and poll steps", () => {
    expect(
      deriveScenarioRunPhase(
        buildStep({ step_order: 14, tool_name: "spawn_scenario_child" })
      )
    ).toBe("renderingShots");
    expect(
      deriveScenarioRunPhase(
        buildStep({ step_order: 15, tool_name: "poll_scenario_child" })
      )
    ).toBe("renderingShots");
  });

  it("reads the phase from the tool name alone, so an inserted step cannot shift it", () => {
    expect(
      deriveScenarioRunPhase(
        buildStep({ step_order: 42, tool_name: "poll_img2img_batch" })
      )
    ).toBe("drawingCastAndSets");
  });

  it("claims no phase for the setup steps and the ordering barrier", () => {
    expect(
      deriveScenarioRunPhase(
        buildStep({ step_order: 0, tool_name: "create_project" })
      )
    ).toBeUndefined();
    expect(
      deriveScenarioRunPhase(
        buildStep({ step_order: 1, tool_name: "create_shot" })
      )
    ).toBeUndefined();
    expect(
      deriveScenarioRunPhase(
        buildStep({ step_order: 5, tool_name: "poll_prev_step_complete" })
      )
    ).toBeUndefined();
  });
});
