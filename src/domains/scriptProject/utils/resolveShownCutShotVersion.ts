import { CutShot, CutShotVersion } from "@schemas/scriptProject";

import { isCutShotVersionRendering } from "./isCutShotVersionRendering";
import { resolveCutShotVersionAssetIdToShow } from "./resolveCutShotVersionAssetIdToShow";

export const resolveShownCutShotVersion = (
  shot: CutShot,
  versionsNewestFirst: CutShotVersion[]
): CutShotVersion | undefined =>
  versionsNewestFirst.find(
    (version) =>
      version.asset_id ===
      resolveCutShotVersionAssetIdToShow(shot, versionsNewestFirst)
  ) ??
  versionsNewestFirst.find((version) => !isCutShotVersionRendering(version)) ??
  versionsNewestFirst[0];
