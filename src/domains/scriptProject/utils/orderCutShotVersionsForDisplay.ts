import { CutShot, CutShotVersion } from "@schemas/scriptProject";

import { buildCutShotVersionNumbers } from "./buildCutShotVersionNumbers";
import { resolveShownCutShotVersion } from "./resolveShownCutShotVersion";
import { sortCutShotVersionsNewestFirst } from "./sortCutShotVersionsNewestFirst";

export type CutShotVersionsInDisplayOrder = {
  shownVersion: CutShotVersion | undefined;
  versionsBelowShownVersion: CutShotVersion[];
  versionsNewestFirst: CutShotVersion[];
  pinnedVersionAssetId: string | null;
  versionNumberByAssetId: Map<string, number>;
};

export const orderCutShotVersionsForDisplay = (
  shot: CutShot | undefined,
  layerCreatedAtMsByLayerId: Map<string, number>
): CutShotVersionsInDisplayOrder => {
  const versionsNewestFirst = sortCutShotVersionsNewestFirst(
    shot?.versions ?? [],
    layerCreatedAtMsByLayerId
  );
  const shownVersion = shot
    ? resolveShownCutShotVersion(shot, versionsNewestFirst)
    : undefined;
  return {
    shownVersion,
    versionsBelowShownVersion: versionsNewestFirst.filter(
      (version) => version.asset_id !== shownVersion?.asset_id
    ),
    versionsNewestFirst,
    pinnedVersionAssetId: shot?.pinned_asset_id ?? null,
    versionNumberByAssetId: buildCutShotVersionNumbers(versionsNewestFirst)
  };
};
