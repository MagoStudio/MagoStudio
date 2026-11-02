import { useBulkRendersRunsForProject } from "@domains/bulkRendersRun/useBulkRendersRuns";
import { useBulkRendersRunStepsForRuns } from "@domains/bulkRendersRun/useBulkRendersRunStepsForRuns";

import { PLAN_STEPS_POLL_INTERVAL_MS } from "./constants";
import { collectInProgressTimelineIds } from "./utils/collectInProgressTimelineIds";
import { isPlanRunFinished } from "./utils/isPlanRunFinished";

/**
 * Shot timelines a background plan is still working on, read from the backend rather than
 * from what this browser tab happened to launch.
 *
 * The run the user pressed Generate on is remembered in memory only, so after a reload — or in
 * a second tab — every shot looked idle while the plan was mid-flight. This survives both.
 */
export const useInProgressShotTimelineIds = (
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

  const inProgressTimelineIds = new Set<string>();
  for (const steps of stepsPerPlan) {
    for (const timelineId of collectInProgressTimelineIds(steps)) {
      inProgressTimelineIds.add(timelineId);
    }
  }

  return inProgressTimelineIds;
};
