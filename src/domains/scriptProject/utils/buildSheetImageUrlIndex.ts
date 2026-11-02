import { SheetGroup } from "@schemas/scriptProject";

export type SheetImageUrls = {
  url: string | undefined;
  thumbnailUrl: string | undefined;
};

/** Both URLs per asset, keyed by asset id.
 *
 * The pair matters: the thumbnail is what a tile draws, but zoom and download must open the
 * full-size image. Collapsing them to one URL makes the zoom show the thumbnail. */
export const buildSheetImageUrlIndex = (
  groups: SheetGroup[]
): Map<string, SheetImageUrls> =>
  new Map(
    groups.flatMap((group) =>
      group.images.map(
        (image) =>
          [
            image.asset_id,
            {
              url: image.url ?? undefined,
              thumbnailUrl: image.thumbnail_url ?? undefined
            }
          ] as const
      )
    )
  );
