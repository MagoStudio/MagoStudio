import { CutShot, CutShotVersion } from "@schemas/scriptProject";

import { isCutShotVersionShownAsRendering } from "./isCutShotVersionShownAsRendering";
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
  versionsNewestFirst.find(
    (version) => !isCutShotVersionShownAsRendering(shot, version)
  ) ??
  versionsNewestFirst[0];
