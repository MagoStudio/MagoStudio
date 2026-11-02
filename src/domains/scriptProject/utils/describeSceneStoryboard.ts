import { SheetGroup, ShotState } from "@schemas/scriptProject";

import { buildStoryboardSheetToken } from "./buildStoryboardSheetToken";
import { describeSceneStoryboardFromBackend } from "./describeSceneStoryboardFromBackend";
import { describeSceneStoryboardFromSheets } from "./describeSceneStoryboardFromSheets";
import { findShotStoryboard } from "./findShotStoryboard";
import { STORYBOARD_TAG_CATEGORY } from "./planStoryboardSceneTagChanges";
import { SceneStoryboardView } from "./sceneStoryboardView";

export const describeSceneStoryboard = (
  scene: Pick<ShotState, "timeline_id" | "tags" | "storyboard">,
  storyboardSheetGroups: SheetGroup[]
): SceneStoryboardView =>
  scene.storyboard
    ? describeSceneStoryboardFromBackend(scene.storyboard)
    : describeSceneStoryboardFromSheets({
        shotStoryboard: findShotStoryboard(
          storyboardSheetGroups,
          scene.timeline_id
        ),
        isStoryboardTaggedOnScene: scene.tags[STORYBOARD_TAG_CATEGORY].includes(
          buildStoryboardSheetToken(scene.timeline_id)
        )
      });
