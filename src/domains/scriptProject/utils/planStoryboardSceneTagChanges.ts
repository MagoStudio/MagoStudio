import { SheetGroup, ShotState } from "@schemas/scriptProject";

import { buildStoryboardSheetToken } from "./buildStoryboardSheetToken";
import { isSheetImageSuccessful } from "./findNewestSuccessfulSheetImage";
import { findShotStoryboard } from "./findShotStoryboard";

export const STORYBOARD_TAG_CATEGORY = "props";

export type StoryboardSceneTagChanges = {
  scenesToAttachStoryboard: ShotState[];
  scenesToDetachStoryboard: ShotState[];
  sceneTimelineIdsNoLongerAwaitingStoryboard: string[];
  sceneTimelineIdsNowAwaitingStoryboard: string[];
};

const hasStoryboardSucceededOnce = (
  storyboardSheetGroups: SheetGroup[],
  sceneTimelineId: string
) => {
  const storyboardSheetToken = buildStoryboardSheetToken(sceneTimelineId);
  return storyboardSheetGroups.some(
    (sheetGroup) =>
      sheetGroup.token === storyboardSheetToken &&
      sheetGroup.enabled &&
      sheetGroup.images.some((image) => isSheetImageSuccessful(image))
  );
};

export const planStoryboardSceneTagChanges = ({
  scenes,
  storyboardSheetGroups,
  sceneTimelineIdsAwaitingStoryboard
}: {
  scenes: ShotState[];
  storyboardSheetGroups: SheetGroup[];
  sceneTimelineIdsAwaitingStoryboard: ReadonlySet<string>;
}): StoryboardSceneTagChanges => {
  const changes: StoryboardSceneTagChanges = {
    scenesToAttachStoryboard: [],
    scenesToDetachStoryboard: [],
    sceneTimelineIdsNoLongerAwaitingStoryboard: [],
    sceneTimelineIdsNowAwaitingStoryboard: []
  };
  const scenesWithStoryboardOnSheets = scenes.filter(
    (scene) => !scene.storyboard
  );
  for (const scene of scenesWithStoryboardOnSheets) {
    const sceneTimelineId = scene.timeline_id;
    const isStoryboardTaggedOnScene = scene.tags[
      STORYBOARD_TAG_CATEGORY
    ].includes(buildStoryboardSheetToken(sceneTimelineId));
    const storyboard = findShotStoryboard(
      storyboardSheetGroups,
      sceneTimelineId
    );
    const hasStoryboardImageToReference = hasStoryboardSucceededOnce(
      storyboardSheetGroups,
      sceneTimelineId
    );

    if (isStoryboardTaggedOnScene && !hasStoryboardImageToReference) {
      changes.scenesToDetachStoryboard.push(scene);
      if (storyboard.isStoryboardRendering)
        changes.sceneTimelineIdsNowAwaitingStoryboard.push(sceneTimelineId);
      continue;
    }

    if (!sceneTimelineIdsAwaitingStoryboard.has(sceneTimelineId)) continue;
    const isStoryboardImageStillToAppear =
      !storyboard.latestStoryboardImage || storyboard.isStoryboardRendering;
    if (isStoryboardImageStillToAppear) continue;
    changes.sceneTimelineIdsNoLongerAwaitingStoryboard.push(sceneTimelineId);
    const hasLatestStoryboardSucceeded =
      !!storyboard.latestStoryboardImage &&
      isSheetImageSuccessful(storyboard.latestStoryboardImage);
    if (hasLatestStoryboardSucceeded && !isStoryboardTaggedOnScene)
      changes.scenesToAttachStoryboard.push(scene);
  }
  return changes;
};
