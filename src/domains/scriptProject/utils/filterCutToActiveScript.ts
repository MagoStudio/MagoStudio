import { CutShot, ProjectCut, ShotState } from "@schemas/scriptProject";

export type CutInActiveScript = {
  cutShotsInActiveScript: CutShot[];
  missingSequenceIdsInActiveScript: (number | null)[];
};

export const filterCutToActiveScript = (
  cut: ProjectCut | undefined,
  shotsDroppedByRecast: ShotState[]
): CutInActiveScript => {
  const droppedTimelineIds = new Set(
    shotsDroppedByRecast.map((shot) => shot.timeline_id)
  );
  const droppedSequenceIds = new Set(
    shotsDroppedByRecast.map((shot) => shot.sequence_id)
  );

  return {
    cutShotsInActiveScript: (cut?.shots ?? []).filter(
      (cutShot) => !droppedTimelineIds.has(cutShot.timeline_id)
    ),
    missingSequenceIdsInActiveScript: (cut?.missing ?? []).filter(
      (sequenceId) => sequenceId === null || !droppedSequenceIds.has(sequenceId)
    )
  };
};
