import { PlanStep, ToolName } from "@schemas/plan";

export type ScenarioRunPhase =
  | "readingScript"
  | "planningShots"
  | "drawingCastAndSets"
  | "preparingReferences"
  | "renderingShots";

const SCENARIO_RUN_PHASE_BY_TOOL_NAME: Partial<
  Record<ToolName, ScenarioRunPhase>
> = {
  submit_script_casting: "readingScript",
  poll_script_casting: "readingScript",
  plan_scenario_shots: "planningShots",
  submit_img2img_batch: "drawingCastAndSets",
  poll_img2img_batch: "drawingCastAndSets",
  batch_complete_gate: "drawingCastAndSets",
  submit_stitch_sheets: "preparingReferences",
  poll_stitch_sheets: "preparingReferences",
  spawn_scenario_child: "renderingShots",
  poll_scenario_child: "renderingShots"
};

export const deriveScenarioRunPhase = (
  activeStep: PlanStep | undefined
): ScenarioRunPhase | undefined => {
  if (!activeStep) return undefined;

  return SCENARIO_RUN_PHASE_BY_TOOL_NAME[activeStep.tool_name];
};
