import { ShotDialogueTurn } from "@schemas/scriptProject";

export const haveDialogueVoiceLinksChanged = (
  savedDialogue: ShotDialogueTurn[],
  linkedDialogue: ShotDialogueTurn[]
): boolean =>
  savedDialogue.length !== linkedDialogue.length ||
  linkedDialogue.some(
    (turn, turnIndex) =>
      (turn.speaker_token ?? null) !==
      (savedDialogue[turnIndex]?.speaker_token ?? null)
  );
