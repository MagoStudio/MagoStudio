import { useBulkRendersRunsForProject } from "@domains/bulkRendersRun/useBulkRendersRuns";
import { useBulkRendersRunStepsForRuns } from "@domains/bulkRendersRun/useBulkRendersRunStepsForRuns";

import { PLAN_STEPS_POLL_INTERVAL_MS } from "./constants";
import { collectInProgressSheetTokens } from "./utils/collectInProgressSheetTokens";
import { isPlanRunFinished } from "./utils/isPlanRunFinished";

/**
 * Entity tokens a background sheet plan is still working on, read from the backend rather than
 * from what this browser tab happened to launch. The shot equivalent is
 * `useInProgressShotTimelineIds`; both share the same plan and step queries.
 */
export const useInProgressSheetTokens = (
  projectId: string | undefined
): Set<string> => {
  const { data: projectPlans } = useBulkRendersRunsForProject(projectId);

  const unfinishedPlanStepsRequests = (projectPlans ?? [])
    .filter((plan) => !isPlanRunFinished(plan.status))
    .map((plan) => ({ bulkRunId: plan.id, isRunActive: true }));

  const stepsPerPlan = useBulkRendersRunStepsForRuns(
    unfinishedPlanStepsRequests,
    PLAN_STEPS_POLL_INTERVAL_MS
  );

  const inProgressTokens = new Set<string>();
  for (const steps of stepsPerPlan) {
    for (const token of collectInProgressSheetTokens(steps)) {
      inProgressTokens.add(token);
    }
  }

  return inProgressTokens;
};
