import { SceneShotDraft } from "./buildEmptySceneShotDraft";
import { hasSceneShotDraftContent } from "./hasSceneShotDraftContent";
import { parseSceneShotDraftSeconds } from "./parseSceneShotDraftSeconds";
import { Beat } from "./shotCutListTypes";

export const buildStoryboardBeatsFromSceneShots = (
  shots: SceneShotDraft[]
): Beat[] =>
  shots.filter(hasSceneShotDraftContent).map((shot) => ({
    framing: shot.framing.trim(),
    action: shot.description.trim(),
    cameraMovement: shot.cameraMovement.trim(),
    cameraSentenceKind: shot.cameraMovement.trim() ? "move" : "none",
    spokenLines: shot.dialogue.trim(),
    durationSeconds: parseSceneShotDraftSeconds(shot.durationSeconds) ?? 0
  }));
