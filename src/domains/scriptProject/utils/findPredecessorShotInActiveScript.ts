import { ShotState } from "@schemas/scriptProject";

export const findPredecessorShotInActiveScript = (
  shot: ShotState,
  shotsInActiveScript: ShotState[]
): ShotState | undefined => {
  const indexInActiveScript = shotsInActiveScript.findIndex(
    (candidate) => candidate.timeline_id === shot.timeline_id
  );
  if (indexInActiveScript <= 0) return undefined;

  return shotsInActiveScript[indexInActiveScript - 1];
};
