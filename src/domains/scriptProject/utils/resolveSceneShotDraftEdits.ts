import { ShotDialogueTurn, ShotState } from "@schemas/scriptProject";

import { buildVideoPromptFromSceneShots } from "./buildVideoPromptFromSceneShots";
import {
  SceneShotLayout,
  parseSceneShotsFromVideoPrompt
} from "./parseSceneShotsFromVideoPrompt";
import { formatShotDialogue } from "./shotDialogueText";
import { sumSceneShotDurationSeconds } from "./sumSceneShotDurationSeconds";

export type SceneShotDraftEdits = {
  videoPrompt?: string;
  dialogue?: ShotDialogueTurn[];
  durationSeconds?: number;
};

export const resolveSceneShotDraftEdits = ({
  shot,
  sceneShotLayout
}: {
  shot: Pick<
    ShotState,
    "timeline_id" | "duration_s" | "video_prompt" | "dialogue"
  >;
  sceneShotLayout: SceneShotLayout;
}): {
  unsavedEdits: SceneShotDraftEdits;
  sceneDurationSeconds: number | null | undefined;
} => {
  const savedDialogue = shot.dialogue ?? [];
  const savedSceneShotLayout = parseSceneShotsFromVideoPrompt(shot);
  const savedSceneAsDrafted = buildVideoPromptFromSceneShots(
    savedSceneShotLayout,
    savedDialogue
  );
  const draftedScene = buildVideoPromptFromSceneShots(
    sceneShotLayout,
    savedDialogue
  );
  const isScenePromptEdited =
    draftedScene.videoPrompt !== savedSceneAsDrafted.videoPrompt ||
    formatShotDialogue(draftedScene.dialogue) !==
      formatShotDialogue(savedSceneAsDrafted.dialogue);
  const draftedSceneDurationSeconds = sumSceneShotDurationSeconds(
    sceneShotLayout.shots
  );
  const isSceneDurationEdited =
    draftedSceneDurationSeconds !== undefined &&
    draftedSceneDurationSeconds !==
      sumSceneShotDurationSeconds(savedSceneShotLayout.shots);

  return {
    unsavedEdits: {
      ...(isScenePromptEdited
        ? {
            videoPrompt: draftedScene.videoPrompt,
            dialogue: draftedScene.dialogue
          }
        : {}),
      ...(isSceneDurationEdited
        ? { durationSeconds: draftedSceneDurationSeconds }
        : {})
    },
    sceneDurationSeconds: draftedSceneDurationSeconds ?? shot.duration_s
  };
};
