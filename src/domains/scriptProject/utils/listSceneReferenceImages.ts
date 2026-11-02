import { SheetGroup, ShotTags } from "@schemas/scriptProject";

import { isStoryboardSheetGroup } from "./isStoryboardSheetGroup";

export type SceneReferenceImage = { assetId: string; name: string };

export const listSceneReferenceImages = ({
  tags,
  sheetGroups,
  tagCategories
}: {
  tags: ShotTags;
  sheetGroups: SheetGroup[];
  tagCategories: (keyof ShotTags)[];
}): SceneReferenceImage[] => {
  const referenceImages: SceneReferenceImage[] = [];
  for (const tagCategory of tagCategories)
    for (const token of tags[tagCategory]) {
      const sheetGroup = sheetGroups.find(
        (candidate) => candidate.token === token
      );
      if (!sheetGroup || isStoryboardSheetGroup(sheetGroup)) continue;
      const assetId = sheetGroup.effective_asset_id;
      const isAlreadyListed = referenceImages.some(
        (referenceImage) => referenceImage.assetId === assetId
      );
      if (assetId && !isAlreadyListed)
        referenceImages.push({ assetId, name: sheetGroup.name });
    }
  return referenceImages;
};
