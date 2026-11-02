import { useBulkRendersRunsForProject } from "@domains/bulkRendersRun/useBulkRendersRuns";
import { useBulkRendersRunStepsForRuns } from "@domains/bulkRendersRun/useBulkRendersRunStepsForRuns";

import { PLAN_STEPS_POLL_INTERVAL_MS } from "./constants";
import { collectFailedTimelineIds } from "./utils/collectFailedTimelineIds";
import { isPlanRunFinished } from "./utils/isPlanRunFinished";

/**
 * Shot timelines a still-running plan has given up on, read from the backend rather than from
 * what this browser tab happened to launch. `useInProgressShotTimelineIds` excludes exactly
 * these; both share the same plan and step queries.
 *
 * Only unfinished plans are read, so this empties once the plan itself settles. That is the
 * window that matters — a Shot the plan abandoned early otherwise reads as rendering until the
 * whole run ends, which was 2h09m on the run of 2026-09-08.
 */
export const useFailedShotTimelineIds = (
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

  const failedTimelineIds = new Set<string>();
  for (const steps of stepsPerPlan) {
    for (const timelineId of collectFailedTimelineIds(steps)) {
      failedTimelineIds.add(timelineId);
    }
  }

  return failedTimelineIds;
};
