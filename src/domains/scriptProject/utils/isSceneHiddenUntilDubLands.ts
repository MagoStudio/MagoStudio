import { CutShot } from "@schemas/scriptProject";

import { isCutShotVersionAwaitingDub } from "./isCutShotVersionAwaitingDub";
import { isCutShotVersionHiddenUntilDubLands } from "./isCutShotVersionHiddenUntilDubLands";

export const isSceneHiddenUntilDubLands = (
  shot: Pick<CutShot, "asset_id" | "versions">
): boolean =>
  shot.asset_id
    ? isCutShotVersionHiddenUntilDubLands(shot, { asset_id: shot.asset_id })
    : shot.versions.some(isCutShotVersionAwaitingDub);
