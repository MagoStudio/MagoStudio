type JsonRecord = Record<string, unknown>;

const RESUMABLE_PLAN_STATUSES = ["PAUSED", "FAILED"];
const UNFINISHED_STEP_STATUSES = ["PENDING", "RUNNING", "FAILED"];

export const supersedeResumablePlanSteps = ({
  plan,
  isStepForSupersededItem,
  supersedingPlanId,
  supersededAt
}: {
  plan: JsonRecord;
  isStepForSupersededItem: (step: JsonRecord) => boolean;
  supersedingPlanId: string;
  supersededAt: string;
}): JsonRecord[] | null => {
  if (!RESUMABLE_PLAN_STATUSES.includes(String(plan.status))) return null;
  const steps = Array.isArray(plan.steps) ? (plan.steps as JsonRecord[]) : [];
  const isStepSupersededNow = (step: JsonRecord) =>
    UNFINISHED_STEP_STATUSES.includes(String(step.status)) &&
    isStepForSupersededItem(step);
  if (!steps.some(isStepSupersededNow)) return null;
  return steps.map((step) =>
    isStepSupersededNow(step)
      ? {
          ...step,
          status: "SKIPPED",
          finished_at: supersededAt,
          error: null,
          result: { reason: "superseded", superseded_by: supersedingPlanId }
        }
      : step
  );
};
