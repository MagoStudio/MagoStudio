import { ShotState } from "@schemas/scriptProject";

export const canSceneDialogueBeAutoLinkedToVoices = (
  scene: Pick<ShotState, "timeline_id" | "dropped" | "locked">,
  renderingSceneTimelineIds: ReadonlySet<string>
): boolean =>
  !scene.dropped &&
  scene.locked !== true &&
  !renderingSceneTimelineIds.has(scene.timeline_id);
