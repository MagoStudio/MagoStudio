import { ShotDialogueTurn } from "@schemas/scriptProject";

/** Human-editable form: one speech turn per line, with an optional `SPEAKER:` cue. */
export const formatShotDialogue = (turns: ShotDialogueTurn[]): string =>
  turns
    .map((turn) => {
      const speaker = turn.speaker?.trim();
      return speaker ? `${speaker}: ${turn.line}` : turn.line;
    })
    .join("\n");

const splitTurn = (text: string): { speaker: string | null; line: string } => {
  const separator = text.indexOf(":");
  if (separator <= 0) return { speaker: null, line: text.trim() };
  return {
    speaker: text.slice(0, separator).trim() || null,
    line: text.slice(separator + 1).trim()
  };
};

/**
 * Convert the textarea back to the structured API shape. Metadata is retained
 * only while it is still trustworthy: a matching cue keeps its cast-character
 * token, and an unchanged line keeps its detected language.
 */
export const parseShotDialogue = (
  text: string,
  previousTurns: ShotDialogueTurn[]
): ShotDialogueTurn[] =>
  text
    .split(/\r?\n/u)
    .map((row) => row.trim())
    .filter(Boolean)
    .map(splitTurn)
    .filter((turn) => turn.line.length > 0)
    .map((turn, index) => {
      const previous = previousTurns[index];
      const sameSpeaker = (previous?.speaker ?? null) === turn.speaker;
      const sameLine = previous?.line === turn.line;
      return {
        speaker: turn.speaker,
        speaker_token: sameSpeaker ? (previous?.speaker_token ?? null) : null,
        line: turn.line,
        language: sameSpeaker && sameLine ? (previous?.language ?? null) : null
      };
    });
