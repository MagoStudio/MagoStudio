import { CutShot, CutShotVersion } from "@schemas/scriptProject";

import { isCutShotVersionAwaitingDub } from "./isCutShotVersionAwaitingDub";

export const isCutShotVersionHiddenUntilDubLands = (
  shot: Pick<CutShot, "versions">,
  version: Pick<CutShotVersion, "asset_id">
): boolean => {
  const shotVersion = shot.versions.find(
    (candidate) => candidate.asset_id === version.asset_id
  );
  return !!shotVersion && isCutShotVersionAwaitingDub(shotVersion);
};
