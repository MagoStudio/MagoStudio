import { SheetGroup } from "@schemas/scriptProject";

export const resolveSheetGroupPreviewImage = (
  group: SheetGroup
): string | undefined => {
  const effectiveImage = group.images.find(
    (image) => image.asset_id === group.effective_asset_id
  );
  const previewImage = effectiveImage ?? group.images[0];

  return previewImage?.thumbnail_url ?? previewImage?.url ?? undefined;
};
