import { AgentScriptScene } from "@schemas/scriptProject";

const SCENE_SEPARATOR = "\n\n";

/** Scene boundaries come from the list, never inferred from text, and the
 * "Shot N:" label is deliberately never translated. */
export const joinScriptScenes = (
  scenes: Pick<AgentScriptScene, "scene_number" | "prompt" | "dialogue_or_vo">[]
): string =>
  scenes
    .map((scene) => ({
      sceneNumber: scene.scene_number,
      prompt: scene.prompt.trim(),
      dialogue: scene.dialogue_or_vo?.trim() ?? ""
    }))
    .filter((scene) => scene.prompt.length > 0)
    .map(({ sceneNumber, prompt, dialogue }) =>
      dialogue
        ? `Shot ${sceneNumber}:\n${prompt}\n${dialogue}`
        : `Shot ${sceneNumber}:\n${prompt}`
    )
    .join(SCENE_SEPARATOR);
