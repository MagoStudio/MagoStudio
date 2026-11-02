import { PlanStep } from "@schemas/plan";

const SHOTS_CHILD_KIND = "shots";

export const findShotsChildPlanId = (
  parentSteps: PlanStep[]
): string | undefined => {
  const shotsSpawnStep = parentSteps.find(
    (step) =>
      step.tool_name === "spawn_scenario_child" &&
      step.tool_args?.kind === SHOTS_CHILD_KIND
  );

  const childPlanId = shotsSpawnStep?.result?.child_plan_id;
  return typeof childPlanId === "string" ? childPlanId : undefined;
};
