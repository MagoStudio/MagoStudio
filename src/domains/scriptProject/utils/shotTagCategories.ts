import { SheetKind, ShotTags } from "@schemas/scriptProject";

import { ShotTagCategory } from "./buildShotReferenceChips";

const TAG_CATEGORY_BY_SHEET_KIND: Record<SheetKind, ShotTagCategory> = {
  character: "characters",
  environment: "environments",
  prop: "props"
};

export const getTagCategoryForSheetKind = (
  kind: SheetKind | null | undefined
): ShotTagCategory | null => (kind ? TAG_CATEGORY_BY_SHEET_KIND[kind] : null);

export const withShotTagRemoved = (
  tags: ShotTags,
  category: ShotTagCategory,
  token: string
): ShotTags => ({
  ...tags,
  [category]: tags[category].filter((tagged) => tagged !== token)
});

export const withShotTagAdded = (
  tags: ShotTags,
  category: ShotTagCategory,
  token: string
): ShotTags =>
  tags[category].includes(token)
    ? tags
    : { ...tags, [category]: [...tags[category], token] };
