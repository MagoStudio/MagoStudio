/* oxlint-disable custom-react/no-use-effect -- legitimate external sync: rewrites a retired shot engine on the backend once the loaded project reveals it */
import { useBulkRendersRunsForProject } from "@domains/bulkRendersRun/useBulkRendersRuns";
import { useEffect, useRef } from "react";

import { NEW_PROJECT_SHOT_RENDER_ENGINE } from "./constants";
import { useSaveProjectSettingsPatch } from "./useSaveProjectSettingsPatch";
import { doesProjectUseRetiredShotRenderEngine } from "./utils/doesProjectUseRetiredShotRenderEngine";
import { isPlanRunFinished } from "./utils/isPlanRunFinished";

export const useMigrateRetiredShotRenderEngine = (
  projectId: string | undefined,
  isRunActiveInThisTab: boolean
) => {
  const { project, saveProjectSettingsPatchAsync } =
    useSaveProjectSettingsPatch(projectId);
  const { data: projectPlans } = useBulkRendersRunsForProject(projectId);
  const projectIdBeingMigrated = useRef<string | undefined>(undefined);

  const areProjectPlansLoaded = projectPlans !== undefined;
  const isAnyProjectPlanRunning = (projectPlans ?? []).some(
    (plan) => !isPlanRunFinished(plan.status)
  );
  const shouldMigrateShotRenderEngine =
    doesProjectUseRetiredShotRenderEngine(project) &&
    areProjectPlansLoaded &&
    !isAnyProjectPlanRunning &&
    !isRunActiveInThisTab;

  /* oxlint-disable react-you-might-not-need-an-effect/no-event-handler -- the stored engine arrives from a fetch, not a user event, so rewriting it is external sync rather than a handler the caller could own */
  useEffect(() => {
    if (!projectId || !shouldMigrateShotRenderEngine) return;
    if (projectIdBeingMigrated.current === projectId) return;
    projectIdBeingMigrated.current = projectId;
    void saveProjectSettingsPatchAsync({
      shot_engine: NEW_PROJECT_SHOT_RENDER_ENGINE
    })?.catch(() => {
      projectIdBeingMigrated.current = undefined;
    });
  }, [projectId, shouldMigrateShotRenderEngine, saveProjectSettingsPatchAsync]);
  /* oxlint-enable react-you-might-not-need-an-effect/no-event-handler */
};
