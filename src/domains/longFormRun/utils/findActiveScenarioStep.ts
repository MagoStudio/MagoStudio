import { PlanStep } from "@schemas/plan";

export const findActiveScenarioStep = (
  steps: PlanStep[]
): PlanStep | undefined => {
  const runningStep = steps.find((step) => step.status === "RUNNING");
  if (runningStep) return runningStep;

  const parkedPendingStep = steps.find(
    (step) => step.status === "PENDING" && !!step.started_at
  );
  if (parkedPendingStep) return parkedPendingStep;

  const completedSteps = steps.filter((step) => step.status === "COMPLETED");
  if (completedSteps.length === 0) return undefined;

  return completedSteps.reduce((mostRecent, step) =>
    step.step_order > mostRecent.step_order ? step : mostRecent
  );
};
