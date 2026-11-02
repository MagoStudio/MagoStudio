import {
  DEFAULT_SCENE_SHOT_CAMERA_MOVEMENT,
  DEFAULT_SCENE_SHOT_FRAMING
} from "../constants";

import { SceneShotDraft } from "./buildEmptySceneShotDraft";

const isFilledBeyondDefault = (fieldValue: string, defaultValue: string) =>
  fieldValue.trim().length > 0 && fieldValue.trim() !== defaultValue;

export const hasSceneShotDraftContent = (draft: SceneShotDraft): boolean =>
  isFilledBeyondDefault(
    draft.cameraMovement,
    DEFAULT_SCENE_SHOT_CAMERA_MOVEMENT
  ) ||
  isFilledBeyondDefault(draft.framing, DEFAULT_SCENE_SHOT_FRAMING) ||
  [draft.description, draft.dialogue].some(
    (fieldValue) => fieldValue.trim().length > 0
  );
