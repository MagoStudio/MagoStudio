import { usePlanProgress } from "@domains/plan/usePlanProgress";
import { usePlanSteps } from "@domains/plan/usePlanSteps";
import { useProject } from "@domains/project/useProject";
import { getTrackClip } from "@domains/track/utils/getTrackClip";
import { isTrackAssetFinished } from "@domains/track/utils/isTrackAssetFinished";
import { Layer, LayerType } from "@schemas/layer";
import { PlanStatus } from "@schemas/plan";
import { Shot } from "@schemas/shot";

import { useRefreshProjectWhileRunIsActive } from "./useRefreshProjectWhileRunIsActive";
import {
  deriveScenarioRunPhase,
  ScenarioRunPhase
} from "./utils/deriveScenarioRunPhase";
import {
  deriveShotCardState,
  ShotCardState
} from "./utils/deriveShotCardState";
import {
  deriveShotFailureOutcome,
  ShotFailureOutcome
} from "./utils/deriveShotFailureOutcome";
import { findActiveScenarioStep } from "./utils/findActiveScenarioStep";
import { findShotsChildPlanId } from "./utils/findShotsChildPlanId";
import { formatShotLabel } from "./utils/formatShotLabel";
import { isLongFormRunUnsettled } from "./utils/isLongFormRunUnsettled";
import { listShotIdsInScriptOrder } from "./utils/listShotIdsInScriptOrder";

export interface LongFormRunViewShot {
  id: string;
  label: string;
  cardState: ShotCardState;
  readyRenderTrack: Layer | undefined;
  failure: ShotFailureOutcome | undefined;
}

export interface LongFormRunView {
  status: PlanStatus | undefined;
  phase: ScenarioRunPhase | undefined;
  isRunSettled: boolean;
  isRunActive: boolean;
  hasShotsChildSpawned: boolean;
  shots: LongFormRunViewShot[];
  projectName: string | undefined;
  isLoading: boolean;
}

const findReadyRenderTrack = (layers: Layer[]): Layer | undefined =>
  layers.find(
    (layer) =>
      layer.type === LayerType.RENDER &&
      !!getTrackClip(layer) &&
      isTrackAssetFinished(layer)
  );

const toViewShot = (shot: Shot, position: number): LongFormRunViewShot => ({
  id: shot.id,
  label: formatShotLabel(position + 1),
  cardState: deriveShotCardState(shot.layers),
  readyRenderTrack: findReadyRenderTrack(shot.layers),
  failure: deriveShotFailureOutcome(shot.layers)
});

export const useLongFormRunView = (
  runId: string | undefined
): LongFormRunView => {
  const { data: progress, isLoading: isProgressLoading } = usePlanProgress(
    runId ?? ""
  );
  const isRunUnsettled = progress
    ? isLongFormRunUnsettled(progress.status)
    : isProgressLoading;

  const { data: parentSteps, isLoading: isStepsLoading } = usePlanSteps(
    runId ?? "",
    isRunUnsettled
  );
  const resolvedParentSteps = parentSteps ?? [];

  const activeStep = findActiveScenarioStep(resolvedParentSteps);
  const phase = deriveScenarioRunPhase(activeStep);

  const shotsChildPlanId = findShotsChildPlanId(resolvedParentSteps);
  const { data: shotsChildSteps } = usePlanSteps(
    shotsChildPlanId ?? "",
    isRunUnsettled
  );
  const shotIdsInScriptOrder = listShotIdsInScriptOrder(shotsChildSteps ?? []);

  const projectId = progress?.project_id ?? undefined;
  const { data: project, isLoading: isProjectLoading } = useProject(projectId);

  useRefreshProjectWhileRunIsActive({
    projectId,
    isRunActive: isRunUnsettled
  });

  const shotsById = new Map(
    (project?.timelines ?? []).map((shot) => [shot.id, shot])
  );
  const shots = shotIdsInScriptOrder
    .map((shotId) => shotsById.get(shotId))
    .filter((shot): shot is Shot => shot !== undefined)
    .map(toViewShot);

  return {
    status: progress?.status,
    phase,
    isRunSettled: !!progress && !isRunUnsettled,
    isRunActive: isRunUnsettled,
    hasShotsChildSpawned: shotsChildPlanId !== undefined,
    shots,
    projectName: project?.name,
    isLoading: isProgressLoading || isStepsLoading || isProjectLoading
  };
};
