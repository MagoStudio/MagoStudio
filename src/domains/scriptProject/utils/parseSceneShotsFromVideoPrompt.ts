import { ShotState } from "@schemas/scriptProject";

import {
  SceneShotDraft,
  buildEmptySceneShotDraft
} from "./buildEmptySceneShotDraft";
import { formatSceneShotSeconds } from "./formatSceneShotSeconds";
import { formatShotDialogue } from "./shotDialogueText";

export type SceneShotLayout = {
  textBeforeShots: string;
  shots: SceneShotDraft[];
  textAfterShots: string;
};

const SHOT_HEADING_PATTERN = /\[Shot\s*\d+\]/gi;
const SHOT_TIMING_PATTERN =
  /^\(\s*(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*s\s*\)\s*/i;
const DIALOGUE_LINE_REFERENCE_PATTERN =
  /\s*(?:[A-Z0-9][A-Z0-9 .'()-]*:\s*)?\{\{line:(\d+)\}\}/g;
const CAMERA_SENTENCE_PATTERN =
  /(?:^|\s)(?:Camera:\s*([^.!?]*)[.!?]?|(The camera\b[^.!?]*[.!?]?))/i;
const FRAMING_MAX_WORD_COUNT = 3;
const NAMED_FRAMING_MAX_WORD_COUNT = 8;
const NAMED_FRAMING_PATTERN =
  /^(?:(?:extreme|medium|high|low|wide|full|long)\s+)*(?:close-up|close up|wide|medium|two-shot|insert|over-the-shoulder|establishing|long shot|full shot|pov|point of view|aerial|overhead|high angle|low angle)\b/i;

const splitOffFraming = (shotText: string) => {
  const firstSentenceEnd = shotText.search(/[.!?](\s|$)/);
  if (firstSentenceEnd < 0) return { framing: "", rest: shotText };
  const firstSentence = shotText.slice(0, firstSentenceEnd).trim();
  const firstSentenceWordCount = firstSentence
    .split(/\s+/)
    .filter(Boolean).length;
  const isShortFramingSentence =
    firstSentenceWordCount <= FRAMING_MAX_WORD_COUNT;
  const isNamedFramingSentence =
    firstSentenceWordCount <= NAMED_FRAMING_MAX_WORD_COUNT &&
    NAMED_FRAMING_PATTERN.test(firstSentence);
  if (!isShortFramingSentence && !isNamedFramingSentence)
    return { framing: "", rest: shotText };
  return {
    framing: firstSentence,
    rest: shotText.slice(firstSentenceEnd + 1).trim()
  };
};

const splitOffCameraMovement = (shotText: string) => {
  const cameraMatch = CAMERA_SENTENCE_PATTERN.exec(shotText);
  if (!cameraMatch) return { cameraMovement: "", rest: shotText };
  const cameraMovement = (cameraMatch[1] ?? cameraMatch[2] ?? "").trim();
  return {
    cameraMovement,
    rest: [
      shotText.slice(0, cameraMatch.index).trimEnd(),
      shotText.slice(cameraMatch.index + cameraMatch[0].length).trimStart()
    ]
      .filter(Boolean)
      .join(" ")
  };
};

const parseShotSegment = (
  segment: string,
  draftId: string,
  sceneDialogue: ShotState["dialogue"]
): { draft: SceneShotDraft; referencedLineNumbers: number[] } => {
  const timingMatch = SHOT_TIMING_PATTERN.exec(segment);
  const durationSeconds = timingMatch
    ? formatSceneShotSeconds(Number(timingMatch[2]) - Number(timingMatch[1]))
    : "";
  const textAfterTiming = timingMatch
    ? segment.slice(timingMatch[0].length)
    : segment;
  const referencedLineNumbers = [
    ...textAfterTiming.matchAll(DIALOGUE_LINE_REFERENCE_PATTERN)
  ].map((reference) => Number(reference[1]));
  const textWithoutDialogue = textAfterTiming
    .replace(DIALOGUE_LINE_REFERENCE_PATTERN, "")
    .trim();
  const { framing, rest: textAfterFraming } =
    splitOffFraming(textWithoutDialogue);
  const { cameraMovement, rest: description } =
    splitOffCameraMovement(textAfterFraming);
  const referencedTurns = referencedLineNumbers
    .map((lineNumber) => sceneDialogue?.[lineNumber - 1])
    .filter((turn) => turn !== undefined);
  return {
    draft: {
      ...buildEmptySceneShotDraft(draftId),
      durationSeconds,
      framing,
      cameraMovement,
      description,
      dialogue: formatShotDialogue(referencedTurns)
    },
    referencedLineNumbers
  };
};

export const parseSceneShotsFromVideoPrompt = (
  shot: Pick<
    ShotState,
    "timeline_id" | "duration_s" | "video_prompt" | "dialogue"
  >
): SceneShotLayout => {
  const videoPrompt = shot.video_prompt ?? "";
  const sceneDialogue = shot.dialogue ?? [];
  const shotHeadings = [...videoPrompt.matchAll(SHOT_HEADING_PATTERN)];
  const draftIdForPosition = (shotPosition: number) =>
    `${shot.timeline_id}-${shotPosition}`;

  if (!shotHeadings.length) {
    const { cameraMovement, rest: description } =
      splitOffCameraMovement(videoPrompt);
    return {
      textBeforeShots: "",
      textAfterShots: "",
      shots: [
        {
          ...buildEmptySceneShotDraft(draftIdForPosition(1)),
          durationSeconds:
            typeof shot.duration_s === "number" && shot.duration_s > 0
              ? formatSceneShotSeconds(shot.duration_s)
              : "",
          framing: "",
          cameraMovement,
          description,
          dialogue: formatShotDialogue(sceneDialogue)
        }
      ]
    };
  }

  const textBeforeShots = videoPrompt.slice(0, shotHeadings[0]!.index).trim();
  const segments = shotHeadings.map((heading, headingIndex) =>
    videoPrompt.slice(
      heading.index + heading[0].length,
      shotHeadings[headingIndex + 1]?.index ?? videoPrompt.length
    )
  );
  const lastSegment = segments.at(-1) ?? "";
  const lastSegmentLineBreak = lastSegment.indexOf("\n");
  const textAfterShots =
    lastSegmentLineBreak < 0
      ? ""
      : lastSegment.slice(lastSegmentLineBreak).trim();
  if (lastSegmentLineBreak >= 0)
    segments[segments.length - 1] = lastSegment.slice(0, lastSegmentLineBreak);

  const parsedSegments = segments.map((segment, segmentIndex) =>
    parseShotSegment(
      segment.trim(),
      draftIdForPosition(segmentIndex + 1),
      sceneDialogue
    )
  );
  const referencedLineNumbers = new Set(
    parsedSegments.flatMap((parsed) => parsed.referencedLineNumbers)
  );
  const unreferencedTurns = sceneDialogue.filter(
    (_, turnIndex) => !referencedLineNumbers.has(turnIndex + 1)
  );
  const shots = parsedSegments.map((parsed) => parsed.draft);
  const firstShot = shots[0];
  if (firstShot && unreferencedTurns.length)
    shots[0] = {
      ...firstShot,
      dialogue: [firstShot.dialogue, formatShotDialogue(unreferencedTurns)]
        .filter(Boolean)
        .join("\n")
    };

  return { textBeforeShots, shots, textAfterShots };
};
