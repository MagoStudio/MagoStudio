import { ShotDialogueTurn } from "@schemas/scriptProject";

import { SceneShotDraft } from "./buildEmptySceneShotDraft";
import { formatSceneShotSeconds } from "./formatSceneShotSeconds";
import { hasSceneShotDraftContent } from "./hasSceneShotDraftContent";
import { parseSceneShotDraftSeconds } from "./parseSceneShotDraftSeconds";
import { SceneShotLayout } from "./parseSceneShotsFromVideoPrompt";
import { parseShotDialogue } from "./shotDialogueText";

const asSentence = (text: string) => {
  const trimmedText = text.trim();
  if (!trimmedText) return "";
  return /[.!?]$/.test(trimmedText) ? trimmedText : `${trimmedText}.`;
};

const joinLinesIntoOneShotLine = (text: string) =>
  text.replace(/\s*\n\s*/g, " ");

const describeCameraMovement = (cameraMovement: string) => {
  const trimmedCameraMovement = cameraMovement.trim();
  if (!trimmedCameraMovement) return "";
  return /^the camera\b/i.test(trimmedCameraMovement)
    ? asSentence(trimmedCameraMovement)
    : `Camera: ${asSentence(trimmedCameraMovement)}`;
};

const isPlainScenePrompt = (
  layout: SceneShotLayout,
  shotsWithContent: SceneShotDraft[]
) => {
  const [onlyShot, ...otherShots] = shotsWithContent;
  return (
    !otherShots.length &&
    !layout.textBeforeShots.trim() &&
    !layout.textAfterShots.trim() &&
    !onlyShot?.framing.trim()
  );
};

export const buildVideoPromptFromSceneShots = (
  layout: SceneShotLayout,
  savedDialogue: ShotDialogueTurn[]
): { videoPrompt: string; dialogue: ShotDialogueTurn[] } => {
  const shotsWithContent = layout.shots.filter(hasSceneShotDraftContent);
  const dialogue = parseShotDialogue(
    shotsWithContent.map((shot) => shot.dialogue).join("\n"),
    savedDialogue
  );

  if (isPlainScenePrompt(layout, shotsWithContent)) {
    const onlyShot = shotsWithContent[0];
    const description = onlyShot?.description.trim() ?? "";
    const cameraSentence = describeCameraMovement(
      onlyShot?.cameraMovement ?? ""
    );
    return {
      videoPrompt: cameraSentence
        ? [asSentence(description), cameraSentence].filter(Boolean).join(" ")
        : description,
      dialogue
    };
  }

  const shotLines: string[] = [];
  let shotStartSeconds: number | undefined = 0;
  let nextDialogueLineNumber = 1;
  for (const [shotIndex, shot] of shotsWithContent.entries()) {
    const shotDurationSeconds = parseSceneShotDraftSeconds(
      shot.durationSeconds
    );
    const shotEndSeconds: number | undefined =
      shotStartSeconds !== undefined && shotDurationSeconds !== undefined
        ? shotStartSeconds + shotDurationSeconds
        : undefined;
    const shotTiming =
      shotStartSeconds !== undefined && shotEndSeconds !== undefined
        ? `(${formatSceneShotSeconds(shotStartSeconds)}-${formatSceneShotSeconds(shotEndSeconds)}s)`
        : "";
    const dialogueReferences = parseShotDialogue(shot.dialogue, []).map(
      (turn) => {
        const lineReference = `{{line:${nextDialogueLineNumber}}}`;
        nextDialogueLineNumber += 1;
        return turn.speaker
          ? `${turn.speaker.toUpperCase()}: ${lineReference}`
          : lineReference;
      }
    );
    shotLines.push(
      [
        `[Shot ${shotIndex + 1}]`,
        shotTiming,
        asSentence(joinLinesIntoOneShotLine(shot.framing)),
        asSentence(joinLinesIntoOneShotLine(shot.description)),
        describeCameraMovement(joinLinesIntoOneShotLine(shot.cameraMovement)),
        ...dialogueReferences
      ]
        .filter(Boolean)
        .join(" ")
    );
    shotStartSeconds = shotEndSeconds;
  }

  return {
    videoPrompt: [
      layout.textBeforeShots.trim(),
      shotLines.join("\n"),
      layout.textAfterShots.trim()
    ]
      .filter(Boolean)
      .join("\n"),
    dialogue
  };
};
