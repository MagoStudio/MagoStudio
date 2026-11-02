import { BulkRendersRunStep } from "@schemas/bulkRendersRun";

export interface BulkRendersRunShotStepProgress {
  completedStepCount: number;
  totalStepCount: number;
}

const isStepDone = (step: BulkRendersRunStep): boolean =>
  step.status === "COMPLETED" || step.status === "SKIPPED";

export const deriveBulkRendersRunShotStepProgress = ({
  shotIds,
  steps,
  chainToolNames
}: {
  shotIds: string[];
  steps: BulkRendersRunStep[];
  chainToolNames?: Set<string>;
}): Record<string, BulkRendersRunShotStepProgress> => {
  const byShotId: Record<string, BulkRendersRunShotStepProgress> =
    Object.create(null);

  for (const shotId of shotIds) {
    const shotSteps = steps
      .filter((step) => step.timeline_id === shotId)
      .filter((step) => !chainToolNames || chainToolNames.has(step.tool_name));
    byShotId[shotId] = {
      completedStepCount: shotSteps.filter(isStepDone).length,
      totalStepCount: shotSteps.length
    };
  }

  return byShotId;
};
