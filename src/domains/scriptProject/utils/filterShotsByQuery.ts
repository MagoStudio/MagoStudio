import { SheetGroup, ShotState } from "@schemas/scriptProject";

import { SHOT_TAG_CATEGORY_ORDER } from "./buildShotReferenceChips";
import { normaliseSearchQuery } from "./normaliseSearchQuery";

export const filterShotsByQuery = (
  shots: ShotState[],
  sheetGroups: SheetGroup[],
  query: string
): ShotState[] => {
  const normalisedQuery = normaliseSearchQuery(query);
  if (!normalisedQuery) return shots;

  const displayNameByToken = new Map(
    sheetGroups.map((group) => [group.token, group.name])
  );

  return shots.filter((shot) => {
    const taggedTokens = SHOT_TAG_CATEGORY_ORDER.flatMap(
      (category) => shot.tags[category]
    );
    const searchableFields = [
      shot.heading,
      shot.video_prompt,
      ...taggedTokens,
      ...taggedTokens.map((token) => displayNameByToken.get(token)),
      String(shot.sequence_id)
    ];

    return searchableFields.some((field) =>
      normaliseSearchQuery(field).includes(normalisedQuery)
    );
  });
};
