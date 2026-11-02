import { SheetGroup, SheetImage } from "@schemas/scriptProject";

/* Local snapshots historically persisted completed generated media with the asset repository's
 * `available` status, while the cloud script API calls the same state `success`. Keep accepting
 * both so projects rendered by older desktop builds do not come back as permanently rendering. */
const SHEET_IMAGE_SUCCESS_STATUSES = new Set(["success", "available"]);

export const isSheetImageSuccessful = (
  image: Pick<SheetImage, "status">
): boolean => SHEET_IMAGE_SUCCESS_STATUSES.has(image.status.toLowerCase());

export const findNewestSuccessfulSheetImage = (
  group: SheetGroup
): SheetImage | undefined => {
  const successfulImages = group.images.filter(isSheetImageSuccessful);
  if (successfulImages.length === 0) return undefined;

  /* Cloud sends newest-first, while existing local snapshots append versions oldest-first.
   * Prefer the recorded creation time so pinning and the "newer version" banner mean the
   * same thing for both origins. Preserve source order for legacy entries without dates. */
  return successfulImages.reduce((newest, candidate) => {
    const newestTime = Date.parse(newest.created_at ?? "");
    const candidateTime = Date.parse(candidate.created_at ?? "");
    if (Number.isNaN(candidateTime)) return newest;
    if (Number.isNaN(newestTime)) return candidate;
    return candidateTime > newestTime ? candidate : newest;
  });
};
