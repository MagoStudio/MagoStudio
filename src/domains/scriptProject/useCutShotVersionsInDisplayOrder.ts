import { useProject } from "@domains/project/useProject";
import { CutShot } from "@schemas/scriptProject";

import {
  CutShotVersionsInDisplayOrder,
  orderCutShotVersionsForDisplay
} from "./utils/orderCutShotVersionsForDisplay";

export const useCutShotVersionsInDisplayOrder = (
  projectId: string | undefined,
  shot: CutShot | undefined
): CutShotVersionsInDisplayOrder => {
  const { data: project } = useProject(projectId);
  const layerCreatedAtMsByLayerId = new Map(
    (project?.timelines ?? [])
      .flatMap((timeline) => timeline.layers)
      .map((layer) => [layer.id, layer.created_at.getTime()] as const)
  );
  return orderCutShotVersionsForDisplay(shot, layerCreatedAtMsByLayerId);
};
