import { PlanStep } from "@schemas/plan";

export const getShotImageOverridesFromSteps = (
  steps: PlanStep[]
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const step of steps) {
    if (step.tool_name !== "use_provided_reference_frame") continue;
    if (!step.timeline_id) continue;
    const assetId = step.tool_args?.asset_id;
    if (typeof assetId !== "string") continue;
    result[step.timeline_id] = assetId;
  }
  return result;
};
