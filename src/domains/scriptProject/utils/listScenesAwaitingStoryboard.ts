import {
  SceneStoryboardSummary,
  SheetGroup,
  ShotState
} from "@schemas/scriptProject";

import { buildStoryboardBeatsFromSceneShots } from "./buildStoryboardBeatsFromSceneShots";
import { findShotStoryboard } from "./findShotStoryboard";
import { parseSceneShotsFromVideoPrompt } from "./parseSceneShotsFromVideoPrompt";
import { MAX_SCENE_STORYBOARD_SHOT_COUNT } from "./sceneStoryboardView";
import { Beat } from "./shotCutListTypes";

const SCENE_STORYBOARD_STATUSES_DUE_FOR_GENERATE = new Set<
  SceneStoryboardSummary["status"]
>(["missing", "failed", "stale"]);

const isSceneStoryboardDueForGenerate = (
  sceneStoryboard: SceneStoryboardSummary
) =>
  SCENE_STORYBOARD_STATUSES_DUE_FOR_GENERATE.has(sceneStoryboard.status) &&
  sceneStoryboard.shot_count <= MAX_SCENE_STORYBOARD_SHOT_COUNT;

export type SceneAwaitingStoryboard = {
  scene: ShotState;
  storyboardBeats: Beat[];
};

export const listScenesAwaitingStoryboard = ({
  scenes,
  storyboardSheetGroups
}: {
  scenes: ShotState[];
  storyboardSheetGroups: SheetGroup[];
}): SceneAwaitingStoryboard[] =>
  scenes
    .filter((scene) => !scene.dropped && !scene.hidden && !scene.locked)
    .filter((scene) => {
      if (scene.storyboard)
        return isSceneStoryboardDueForGenerate(scene.storyboard);
      const storyboard = findShotStoryboard(
        storyboardSheetGroups,
        scene.timeline_id
      );
      return (
        !storyboard.latestFinishedStoryboardImageUrl &&
        !storyboard.isStoryboardRendering
      );
    })
    .map((scene) => ({
      scene,
      storyboardBeats: buildStoryboardBeatsFromSceneShots(
        parseSceneShotsFromVideoPrompt(scene).shots
      )
    }))
    .filter(({ storyboardBeats }) => storyboardBeats.length > 0);
