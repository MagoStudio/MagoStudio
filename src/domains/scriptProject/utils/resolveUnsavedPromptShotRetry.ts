import { ShotDialogueTurn, ShotState } from "@schemas/scriptProject";

export type ShotPromptDraft = {
  videoPrompt: string;
  hasUnsavedPrompt: boolean;
  dialogue?: ShotDialogueTurn[];
  hasUnsavedDialogue?: boolean;
};

export const resolveUnsavedPromptShotRetry = ({
  failedShot,
  failedDraft,
  latestShot
}: {
  failedShot: ShotState;
  failedDraft: ShotPromptDraft;
  latestShot: ShotState | undefined;
}): { shot: ShotState; draft: ShotPromptDraft } => {
  if (!latestShot) return { shot: failedShot, draft: failedDraft };

  const currentDraft =
    failedDraft.dialogue !== undefined &&
    JSON.stringify(latestShot.dialogue ?? []) !==
      JSON.stringify(failedShot.dialogue ?? [])
      ? {
          ...failedDraft,
          dialogue: latestShot.dialogue ?? [],
          hasUnsavedDialogue: false
        }
      : failedDraft;

  const hasPromptBeenSavedSinceFailure =
    (latestShot.video_prompt ?? "") !== (failedShot.video_prompt ?? "");
  if (hasPromptBeenSavedSinceFailure) {
    return {
      shot: latestShot,
      draft: {
        ...currentDraft,
        videoPrompt: latestShot.video_prompt ?? "",
        hasUnsavedPrompt: false
      }
    };
  }

  return { shot: latestShot, draft: currentDraft };
};
