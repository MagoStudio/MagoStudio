import { SheetGroup, SheetKind } from "@schemas/scriptProject";

const SHEET_KIND_ORDER: SheetKind[] = ["character", "environment", "prop"];

export type SheetGroupSection = {
  kind: SheetKind | null;
  groups: SheetGroup[];
};

export const groupSheetGroupsByKind = (
  groups: SheetGroup[]
): SheetGroupSection[] => {
  const kindedSections: SheetGroupSection[] = SHEET_KIND_ORDER.map((kind) => ({
    kind,
    groups: groups.filter((group) => group.kind === kind)
  }));

  const groupsWithNoKind = groups.filter(
    (group) => !group.kind || !SHEET_KIND_ORDER.includes(group.kind)
  );

  return [...kindedSections, { kind: null, groups: groupsWithNoKind }].filter(
    (section) => section.groups.length > 0
  );
};
