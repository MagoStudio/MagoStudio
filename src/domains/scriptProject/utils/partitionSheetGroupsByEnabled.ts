import { SheetGroup } from "@schemas/scriptProject";

export type SheetGroupsByEnabled = {
  enabledGroups: SheetGroup[];
  disabledGroups: SheetGroup[];
};

/** Re-casting a script disables every entity the new script no longer uses, rather than
 * deleting it — its images are already paid for, and re-adding the entity brings them back.
 * They stay reachable behind a toggle, but must not pad the counts. */
export const partitionSheetGroupsByEnabled = (
  groups: SheetGroup[]
): SheetGroupsByEnabled => ({
  enabledGroups: groups.filter((group) => group.enabled),
  disabledGroups: groups.filter((group) => !group.enabled)
});
