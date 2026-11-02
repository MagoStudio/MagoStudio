import {
  DEFAULT_SCENE_SHOT_CAMERA_MOVEMENT,
  DEFAULT_SCENE_SHOT_FRAMING
} from "../constants";

export type SceneShotDraft = {
  draftId: string;
  durationSeconds: string;
  cameraMovement: string;
  framing: string;
  description: string;
  dialogue: string;
};

export const buildEmptySceneShotDraft = (draftId: string): SceneShotDraft => ({
  draftId,
  durationSeconds: "",
  cameraMovement: DEFAULT_SCENE_SHOT_CAMERA_MOVEMENT,
  framing: DEFAULT_SCENE_SHOT_FRAMING,
  description: "",
  dialogue: ""
});
