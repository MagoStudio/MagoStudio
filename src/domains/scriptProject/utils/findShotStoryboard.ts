import { SheetGroup, SheetImage } from "@schemas/scriptProject";

import { buildStoryboardSheetToken } from "./buildStoryboardSheetToken";
import { isSheetImageSuccessful } from "./findNewestSuccessfulSheetImage";
import { isSheetImageRendering } from "./isSheetImageRendering";

export type ShotStoryboard = {
  latestStoryboardImage: SheetImage | undefined;
  isStoryboardRendering: boolean;
  hasLatestStoryboardRenderFailed: boolean;
  latestFinishedStoryboardImageUrl: string | undefined;
  latestFinishedStoryboardClipId?: string;
  latestFinishedStoryboardAssetId?: string;
};

const byNewestFirstWithJustSubmittedImagesFirst = (
  firstImage: SheetImage,
  secondImage: SheetImage
): number => {
  if (!firstImage.created_at && !secondImage.created_at) return 0;
  if (!firstImage.created_at) return -1;
  if (!secondImage.created_at) return 1;
  return secondImage.created_at.localeCompare(firstImage.created_at);
};

export const findShotStoryboard = (
  sheetGroups: SheetGroup[],
  shotTimelineId: string
): ShotStoryboard => {
  const storyboardSheetToken = buildStoryboardSheetToken(shotTimelineId);
  const storyboardImagesNewestFirst = [
    ...(sheetGroups.find(
      (sheetGroup) =>
        sheetGroup.token === storyboardSheetToken && sheetGroup.enabled
    )?.images ?? [])
  ].sort(byNewestFirstWithJustSubmittedImagesFirst);
  const [latestStoryboardImage] = storyboardImagesNewestFirst;
  const isStoryboardRendering = latestStoryboardImage
    ? isSheetImageRendering(latestStoryboardImage)
    : false;
  const latestFinishedStoryboardImage = storyboardImagesNewestFirst.find(
    (image) => !isSheetImageRendering(image) && image.url
  );

  return {
    latestStoryboardImage,
    isStoryboardRendering,
    hasLatestStoryboardRenderFailed:
      !!latestStoryboardImage &&
      !isStoryboardRendering &&
      !isSheetImageSuccessful(latestStoryboardImage),
    latestFinishedStoryboardImageUrl:
      latestFinishedStoryboardImage?.url ?? undefined,
    latestFinishedStoryboardClipId: latestFinishedStoryboardImage?.clip_id,
    latestFinishedStoryboardAssetId: latestFinishedStoryboardImage?.asset_id
  };
};
