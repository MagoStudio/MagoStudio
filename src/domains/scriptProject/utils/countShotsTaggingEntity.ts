import { ShotState } from "@schemas/scriptProject";

import { SHOT_TAG_CATEGORY_ORDER } from "./buildShotReferenceChips";

/** How many shots re-pinning this entity would mark stale.
 *
 * A shot's staleness includes its resolved reference ids, so moving one entity's pin marks every
 * shot that tags it — one click can queue many paid re-renders. */
export const countShotsTaggingEntity = (
  shots: ShotState[],
  token: string
): number =>
  shots.filter((shot) =>
    SHOT_TAG_CATEGORY_ORDER.some((category) =>
      shot.tags[category].includes(token)
    )
  ).length;
