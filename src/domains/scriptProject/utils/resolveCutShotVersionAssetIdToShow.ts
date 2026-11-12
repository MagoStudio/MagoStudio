import { CutShot, CutShotVersion } from "@schemas/scriptProject";

import { isCutShotVersionAwaitingDub } from "./isCutShotVersionAwaitingDub";
import { isCutShotVersionRendering } from "./isCutShotVersionRendering";

export const resolveCutShotVersionAssetIdToShow = (
  shot: Pick<CutShot, "pinned_asset_id">,
  versionsNewestFirst: CutShotVersion[]
): string | null => {
  const [newestVersion] = versionsNewestFirst;
  const isNewestVersionStillRendering =
    !!newestVersion &&
    (isCutShotVersionRendering(newestVersion) ||
      isCutShotVersionAwaitingDub(newestVersion));
  return isNewestVersionStillRendering
    ? newestVersion.asset_id
    : (shot.pinned_asset_id ?? null);
};
