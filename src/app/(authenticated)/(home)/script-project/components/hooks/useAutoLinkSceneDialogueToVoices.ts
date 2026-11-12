import { canSceneDialogueBeAutoLinkedToVoices } from "@domains/scriptProject/utils/canSceneDialogueBeAutoLinkedToVoices";
import { haveDialogueVoiceLinksChanged } from "@domains/scriptProject/utils/haveDialogueVoiceLinksChanged";
import { ShotDialogueTurn, ShotState } from "@schemas/scriptProject";
import { useEffect, useRef } from "react";

export const useAutoLinkSceneDialogueToVoices = ({
  scenes,
  renderingSceneTimelineIds,
  isLinkingReady,
  linkSceneDialogueToVoices,
  saveLinkedSceneDialogue
}: {
  scenes: ShotState[];
  renderingSceneTimelineIds: ReadonlySet<string>;
  isLinkingReady: boolean;
  linkSceneDialogueToVoices: (
    dialogue: ShotDialogueTurn[],
    tags: ShotState["tags"]
  ) => ShotDialogueTurn[];
  saveLinkedSceneDialogue: (
    scene: ShotState,
    linkedDialogue: ShotDialogueTurn[],
    onSaveFailed: () => void
  ) => void;
}) => {
  const savedLinkSignaturesRef = useRef(new Set<string>());
  const scenesNeedingVoiceLinks = isLinkingReady
    ? scenes
        .filter((scene) =>
          canSceneDialogueBeAutoLinkedToVoices(scene, renderingSceneTimelineIds)
        )
        .map((scene) => ({
          scene,
          linkedDialogue: linkSceneDialogueToVoices(
            scene.dialogue ?? [],
            scene.tags
          )
        }))
        .filter(({ scene, linkedDialogue }) =>
          haveDialogueVoiceLinksChanged(scene.dialogue ?? [], linkedDialogue)
        )
    : [];
  const voiceLinkSignature = scenesNeedingVoiceLinks
    .map(
      ({ scene, linkedDialogue }) =>
        `${scene.timeline_id}:${linkedDialogue.map((turn) => turn.speaker_token ?? "").join(",")}`
    )
    .join("|");

  // oxlint-disable-next-line custom-react/no-use-effect -- external sync: writes voice links the backend needs onto saved scene dialogue once project data has loaded, once per change
  useEffect(() => {
    for (const { scene, linkedDialogue } of scenesNeedingVoiceLinks) {
      const signature = `${scene.timeline_id}:${linkedDialogue.map((turn) => turn.speaker_token ?? "").join(",")}`;
      if (savedLinkSignaturesRef.current.has(signature)) continue;
      savedLinkSignaturesRef.current.add(signature);
      // oxlint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent -- the callback saves to the backend, it does not lift state to a parent
      saveLinkedSceneDialogue(scene, linkedDialogue, () => {
        savedLinkSignaturesRef.current.delete(signature);
      });
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the set of needed links changes
  }, [voiceLinkSignature]);
};
