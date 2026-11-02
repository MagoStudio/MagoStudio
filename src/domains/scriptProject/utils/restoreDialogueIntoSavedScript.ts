import { AgentScriptDocument } from "@schemas/scriptProject";

import { joinScriptScenes } from "./joinScriptScenes";

export const restoreDialogueIntoSavedScript = (
  savedScript: string,
  agentScriptDocument: AgentScriptDocument | null
): string => {
  const scenes = agentScriptDocument?.scenes ?? [];
  const hasSavedDialogue = scenes.some(
    (scene) => (scene.dialogue_or_vo?.trim() ?? "").length > 0
  );
  if (!hasSavedDialogue) return savedScript;

  const promptOnlyScript = joinScriptScenes(
    scenes.map((scene) => ({ ...scene, dialogue_or_vo: null }))
  );
  const isSavedScriptUntouchedPromptOnlyText =
    savedScript.trim() === promptOnlyScript;
  if (!isSavedScriptUntouchedPromptOnlyText) return savedScript;

  return joinScriptScenes(scenes);
};
