import { PlanStep, ToolName } from "@schemas/plan";
import { describe, expect, it } from "vitest";

import { getShotImageOverridesFromSteps } from "./getShotImageOverridesFromSteps";

function step(
  toolName: ToolName,
  timelineId: string | undefined,
  toolArgs?: Record<string, unknown>
): PlanStep {
  return {
    id: `${timelineId ?? "no-tl"}-${toolName}`,
    plan_id: "plan-1",
    timeline_id: timelineId,
    step_order: 0,
    tool_name: toolName,
    tool_args: toolArgs,
    status: "COMPLETED"
  } as PlanStep;
}

describe("getShotImageOverridesFromSteps", () => {
  it("extracts asset_id per timeline from use_provided_reference_frame steps", () => {
    const result = getShotImageOverridesFromSteps([
      step("get_timeline_info", "shot-1"),
      step("use_provided_reference_frame", "shot-1", { asset_id: "asset-1" }),
      step("submit_img2img", "shot-2"),
      step("use_provided_reference_frame", "shot-3", { asset_id: "asset-3" })
    ]);

    expect(result).toEqual({ "shot-1": "asset-1", "shot-3": "asset-3" });
  });

  it("ignores use_provided_reference_frame steps missing a timeline id", () => {
    const result = getShotImageOverridesFromSteps([
      step("use_provided_reference_frame", undefined, { asset_id: "asset-1" })
    ]);

    expect(result).toEqual({});
  });

  it("ignores use_provided_reference_frame steps with a non-string asset_id", () => {
    const result = getShotImageOverridesFromSteps([
      step("use_provided_reference_frame", "shot-1", { asset_id: 123 }),
      step("use_provided_reference_frame", "shot-2")
    ]);

    expect(result).toEqual({});
  });

  it("returns an empty object for a plan with no image-overridden shots", () => {
    const result = getShotImageOverridesFromSteps([
      step("submit_img2img", "shot-1"),
      step("submit_video_render", "shot-1")
    ]);

    expect(result).toEqual({});
  });
});
