import { CutShot, CutShotVersion } from "@schemas/scriptProject";

import { buildCutShotVersionNumbers } from "./buildCutShotVersionNumbers";
import { isCutShotVersionHiddenUntilDubLands } from "./isCutShotVersionHiddenUntilDubLands";
import { resolveShownCutShotVersion } from "./resolveShownCutShotVersion";
import { sortCutShotVersionsNewestFirst } from "./sortCutShotVersionsNewestFirst";

export type CutShotVersionsInDisplayOrder = {
  shownVersion: CutShotVersion | undefined;
  versionsNewestFirst: CutShotVersion[];
  displayedPinnedVersionAssetId: string | null;
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
  const isPinnedVersionStillBeingDubbed =
    !!shot?.pinned_asset_id &&
    isCutShotVersionHiddenUntilDubLands(shot, {
      asset_id: shot.pinned_asset_id
    });
  return {
    shownVersion,
    versionsNewestFirst,
    displayedPinnedVersionAssetId: isPinnedVersionStillBeingDubbed
      ? null
      : (shot?.pinned_asset_id ?? null),
    versionNumberByAssetId: buildCutShotVersionNumbers(versionsNewestFirst)
  };
};
