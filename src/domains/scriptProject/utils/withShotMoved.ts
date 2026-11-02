import { ShotState } from "@schemas/scriptProject";

export const withShotMoved = (
  shots: ShotState[],
  movedShotTimelineId: string,
  targetShotIndex: number
): ShotState[] => {
  const shotsInTabOrder = [...shots].sort(
    (firstShot, secondShot) => firstShot.shot_index - secondShot.shot_index
  );
  const movedShot = shotsInTabOrder.find(
    (shot) => shot.timeline_id === movedShotTimelineId
  );
  if (!movedShot) return shots;

  const shotsWithoutMovedShot = shotsInTabOrder.filter(
    (shot) => shot !== movedShot
  );
  const clampedTargetShotIndex = Math.min(
    Math.max(targetShotIndex, 0),
    shotsWithoutMovedShot.length
  );
  shotsWithoutMovedShot.splice(clampedTargetShotIndex, 0, movedShot);

  return shotsWithoutMovedShot.map((shot, shotIndex) =>
    shot.shot_index === shotIndex ? shot : { ...shot, shot_index: shotIndex }
  );
};
