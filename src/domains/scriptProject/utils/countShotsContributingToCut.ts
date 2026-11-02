import { CutShot } from "@schemas/scriptProject";

export const doesShotContributeToCut = (
  cutShot: CutShot | undefined
): boolean => !!cutShot?.asset_id;

/** The user chose this take, rather than the cut falling back to the newest finished render. */
export const isShotPinnedAsFinal = (cutShot: CutShot | undefined): boolean =>
  !!cutShot?.pinned_asset_id;

export const countShotsContributingToCut = (cutShots: CutShot[]): number =>
  cutShots.filter((cutShot) => doesShotContributeToCut(cutShot)).length;

export const countShotsPinnedAsFinal = (cutShots: CutShot[]): number =>
  cutShots.filter((cutShot) => isShotPinnedAsFinal(cutShot)).length;
