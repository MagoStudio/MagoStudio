import { ProjectCut } from "@schemas/scriptProject";

import { isCutShotVersionAwaitingDub } from "./isCutShotVersionAwaitingDub";
import { isCutShotVersionRendering } from "./isCutShotVersionRendering";

export const isCutStillBeingProduced = (cut: ProjectCut): boolean =>
  cut.shots.some((shot) =>
    shot.versions.some(
      (version) =>
        isCutShotVersionAwaitingDub(version) ||
        isCutShotVersionRendering(version)
    )
  );
