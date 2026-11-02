import { SheetGroup } from "@schemas/scriptProject";

import { normaliseSearchQuery } from "./normaliseSearchQuery";

export const filterSheetGroupsByQuery = (
  groups: SheetGroup[],
  query: string
): SheetGroup[] => {
  const normalisedQuery = normaliseSearchQuery(query);
  if (!normalisedQuery) return groups;

  return groups.filter((group) =>
    [group.name, group.token].some((field) =>
      normaliseSearchQuery(field).includes(normalisedQuery)
    )
  );
};
