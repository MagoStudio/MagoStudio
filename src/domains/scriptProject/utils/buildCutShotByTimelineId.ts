import { CutShot, ProjectCut } from "@schemas/scriptProject";

export const buildCutShotByTimelineId = (
  cut: ProjectCut | undefined
): Map<string, CutShot> =>
  new Map(
    [...(cut?.shots ?? []), ...(cut?.hidden_shots ?? [])].map((cutShot) => [
      cutShot.timeline_id,
      cutShot
    ])
  );
