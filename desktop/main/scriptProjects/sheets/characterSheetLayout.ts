import {
  APPEARANCE_MARKER,
  BODY_PLAN_QUESTION,
  BODY_PLAN_SCHEMA,
  FEATURE_LINE,
  LAYOUT_PREFIX,
  LAYOUT_SUFFIX,
  POSE,
  ROW_SPACING,
  VIEW_BACK,
  VIEW_DIAGONAL,
  VIEW_FRONT,
  VIEW_SIDE
} from "./characterSheetLayout.generated";

export type BodyPlan = "upright" | "four_legged";
export const resolveBodyPlan = (value: unknown): BodyPlan | null =>
  value === "upright" || value === "four_legged" ? value : null;

/** Unwrap recorded prompts and remove legacy layout text. */
export const appearanceOnly = (prompt: string): string =>
  (prompt || "")
    .split(APPEARANCE_MARKER)
    .at(-1)!
    .replace(/\b(?:character|reference|model|design)\s+sheets?\b/gi, "")
    .replace(
      /\b(?:full[- ]body\s+)?(?:character\s+)?turnarounds?(?:\s*\/\s*reference\s+sheet)?\b/gi,
      ""
    )
    .replace(
      /\bmultiple\s+(?:consistent\s+)?(?:views|angles)(?:\s*\([^)]*\))?/gi,
      ""
    )
    .replace(/^[\s,;:.-]*(?:of\s+)?/i, "")
    .replace(/\s*,\s*(?:,\s*)+/g, ", ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const sheetArrangement = (
  bodyPlan: BodyPlan | null,
  frame?: unknown[] | null
): string => {
  if (
    bodyPlan !== "upright" &&
    frame?.length === 2 &&
    Number(frame[1]) >= Number(frame[0])
  )
    return `Three of the same individual are shown side by side in one row across the middle of the picture, ${ROW_SPACING}. From left to right: the first ${VIEW_FRONT}; the second ${VIEW_SIDE}; the third ${VIEW_BACK}. They are small in the picture, leaving plenty of empty backdrop above and below them.`;
  return `Four of the same individual are shown side by side in one row on one continuous floor, ${ROW_SPACING}. From left to right: the first ${VIEW_FRONT}; the second ${VIEW_DIAGONAL}; the third ${VIEW_SIDE}; the fourth ${VIEW_BACK}.`;
};

export const characterSheetPrompt = (
  appearance: string,
  bodyPlan: BodyPlan | null,
  frame?: unknown[] | null
): string =>
  [
    LAYOUT_PREFIX +
      sheetArrangement(bodyPlan, frame) +
      " " +
      POSE[0]!.toUpperCase() +
      POSE.slice(1) +
      LAYOUT_SUFFIX,
    FEATURE_LINE,
    APPEARANCE_MARKER + appearanceOnly(appearance)
  ].join("\n\n");

export const sheetOutputSize = (kind: unknown, size: unknown[]): unknown[] =>
  kind === "character" &&
  size.length === 2 &&
  Number(size[0]) > 0 &&
  Number(size[0]) < Number(size[1])
    ? [size[1], size[0]]
    : [...size];

/** Automatic classification stays outside the fingerprint and never blocks a render. */
export const classifyBodyPlan = async (
  appearance: string,
  call: (prompt: string) => Promise<string>
): Promise<BodyPlan | null> => {
  try {
    const answer = JSON.parse(
      await call(
        BODY_PLAN_QUESTION +
          appearance +
          "\n\nReturn JSON matching this schema: " +
          JSON.stringify(BODY_PLAN_SCHEMA)
      )
    ) as { body_plan?: unknown };
    return resolveBodyPlan(answer.body_plan);
  } catch {
    return null;
  }
};
