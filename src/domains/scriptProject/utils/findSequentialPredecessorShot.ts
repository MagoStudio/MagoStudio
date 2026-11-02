import { ShotState } from "@schemas/scriptProject";

import { findPredecessorShotInActiveScript } from "./findPredecessorShotInActiveScript";

export const findSequentialPredecessorShot = (
  shot: ShotState,
  shotsInActiveScript: ShotState[]
): ShotState | undefined =>
  findPredecessorShotInActiveScript(
    shot,
    shotsInActiveScript.filter(
      (candidate) =>
        !candidate.hidden || candidate.timeline_id === shot.timeline_id
    )
  );
