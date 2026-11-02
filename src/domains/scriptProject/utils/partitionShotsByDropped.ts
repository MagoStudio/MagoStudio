import { ShotState } from "@schemas/scriptProject";

export type ShotsByDropped = {
  shotsInActiveScript: ShotState[];
  shotsDroppedByRecast: ShotState[];
};

const byAscendingShotIndex = (
  firstShot: ShotState,
  secondShot: ShotState
): number => firstShot.shot_index - secondShot.shot_index;

export const partitionShotsByDropped = (shots: ShotState[]): ShotsByDropped => {
  const shotsInActiveScript: ShotState[] = [];
  const shotsDroppedByRecast: ShotState[] = [];

  for (const shot of shots) {
    if (shot.dropped) shotsDroppedByRecast.push(shot);
    else shotsInActiveScript.push(shot);
  }

  return {
    shotsInActiveScript: shotsInActiveScript.sort(byAscendingShotIndex),
    shotsDroppedByRecast: shotsDroppedByRecast.sort(byAscendingShotIndex)
  };
};
