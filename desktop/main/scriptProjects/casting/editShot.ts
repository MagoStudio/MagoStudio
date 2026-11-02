import { textOf } from "../../vlm/dialogue";
import { sequentialShotConfig } from "../shots/planShotRun";

/**
 * Editing one shot: the backend's request checks (same messages) and its
 * write. Casting-owned fields are tracked individually in
 * `edited_fields`, which is what lets a re-cast keep the user's overrides
 * without freezing the rest of the script (see materialiseCasting).
 */

type JsonRecord = Record<string, unknown>;

const MAX_DIALOGUE_TURNS = 20;
const MAX_DIALOGUE_CHARACTERS = 1200;
const MAX_CHARACTERS = 12;
const MAX_PROPS = 20;

/** The prompt-rewrite settings, in menu order. */
export const PROMPT_REWRITE_SETTINGS = [
  "mago",
  "fal_balanced",
  "fal_quality",
  "raw"
] as const;

const ALLOWED_FIELDS = [
  "video_prompt",
  "dialogue",
  "tags",
  "duration_s",
  "sequential",
  "prompt_rewrite",
  "locked",
  "shot_index",
  "hidden",
  "heading"
];

const ADD_SHOT_FIELDS = [
  "shot_index",
  "heading",
  "video_prompt",
  "dialogue",
  "tags",
  "duration_s"
];

/** The timeline name's column length. */
const HEADING_MAX_LENGTH = 200;
const FIELDS_THAT_ARE_NOT_SHOT_EDITS = new Set(["locked", "heading"]);

const TAG_GROUPS = ["characters", "environments", "props"] as const;
const ALLOWED_TURN_FIELDS = new Set([
  "speaker",
  "speaker_token",
  "line",
  "language"
]);

// oxlint-disable-next-line no-magic-numbers -- the HTTP statuses the cloud answers with
export const SHOT_EDIT_STATUS = {
  badRequest: 400,
  notFound: 404,
  conflict: 409,
  unprocessable: 422
} as const;
type ShotEditStatus = (typeof SHOT_EDIT_STATUS)[keyof typeof SHOT_EDIT_STATUS];

/** A refused edit, with the status the cloud would answer it with. */
export class ShotEditError extends Error {
  constructor(
    message: string,
    readonly status: ShotEditStatus = SHOT_EDIT_STATUS.badRequest
  ) {
    super(message);
  }
}

const isRecord = (value: unknown): value is JsonRecord =>
  !!value && typeof value === "object" && !Array.isArray(value);

const tagCountError = (tags: JsonRecord): string | null => {
  const count = (group: string) =>
    Array.isArray(tags[group]) ? (tags[group] as unknown[]).length : 0;
  const characters = count("characters");
  if (characters > MAX_CHARACTERS)
    return `a shot can feature at most ${MAX_CHARACTERS} characters; this one tags ${characters}`;
  const props = count("props") + Math.max(0, count("environments") - 1);
  if (props > MAX_PROPS)
    return (
      `a shot can feature at most ${MAX_PROPS} props, and every environment after ` +
      `the first counts as one; this one tags ${props}`
    );
  return null;
};

const headingError = (
  heading: unknown,
  { isBlankAllowed }: { isBlankAllowed: boolean }
): string | null => {
  if (typeof heading !== "string") return "heading must be a string";
  if (!heading.trim())
    return isBlankAllowed ? null : "heading must be a non-empty string";
  if (heading.trim().length > HEADING_MAX_LENGTH)
    return `heading must be at most ${HEADING_MAX_LENGTH} characters`;
  return null;
};

const shotIndexError = (value: unknown): string | null =>
  typeof value !== "number" || !Number.isInteger(value) || value < 0
    ? "shot_index must be a non-negative integer"
    : null;

/** The cloud's request checks for an added shot. Throws ShotEditError. */
export const validateAddedShot = (
  fields: JsonRecord,
  taggableTokens: Set<string>
): void => {
  const unknown = Object.keys(fields).filter(
    (field) => !ADD_SHOT_FIELDS.includes(field)
  );
  if (unknown.length)
    throw new ShotEditError(`unknown field(s): ${unknown.sort().join(", ")}`);
  if (fields.shot_index !== null && fields.shot_index !== undefined) {
    const indexError = shotIndexError(fields.shot_index);
    if (indexError) throw new ShotEditError(indexError);
  }
  if (fields.heading !== null && fields.heading !== undefined) {
    const error = headingError(fields.heading, { isBlankAllowed: true });
    if (error) throw new ShotEditError(error);
  }
  const contentFields = Object.fromEntries(
    Object.entries(fields).filter(
      ([field]) => field !== "shot_index" && field !== "heading"
    )
  );
  if (!Object.keys(contentFields).length) return;
  validateShotEdit(contentFields, {
    shot: { tags: {} },
    taggableTokens,
    hasRenders: false
  });
};

/** The cloud's request checks for a shot edit, in its order. Throws ShotEditError. */
export const validateShotEdit = (
  fields: JsonRecord,
  context: {
    shot: JsonRecord;
    taggableTokens: Set<string>;
    hasRenders: boolean;
  }
): void => {
  const unknown = Object.keys(fields).filter(
    (field) => !ALLOWED_FIELDS.includes(field)
  );
  if (unknown.length)
    throw new ShotEditError(`unknown field(s): ${unknown.sort().join(", ")}`);
  if (!Object.keys(fields).length)
    throw new ShotEditError(
      `nothing to change — send one of ${[...ALLOWED_FIELDS].sort().join(", ")}`
    );
  if (
    "sequential" in fields &&
    fields.sequential !== null &&
    !isRecord(fields.sequential)
  )
    throw new ShotEditError("sequential must be an object or null");
  if (
    "locked" in fields &&
    fields.locked !== null &&
    typeof fields.locked !== "boolean"
  )
    throw new ShotEditError("locked must be a boolean or null");
  if (
    "hidden" in fields &&
    fields.hidden !== null &&
    typeof fields.hidden !== "boolean"
  )
    throw new ShotEditError("hidden must be a boolean or null");
  if ("heading" in fields) {
    const error = headingError(fields.heading, { isBlankAllowed: false });
    if (error) throw new ShotEditError(error);
  }
  if (fields.shot_index !== null && fields.shot_index !== undefined) {
    const indexError = shotIndexError(fields.shot_index);
    if (indexError) throw new ShotEditError(indexError);
  }
  if (
    "video_prompt" in fields &&
    fields.video_prompt !== null &&
    typeof fields.video_prompt !== "string"
  )
    throw new ShotEditError("video_prompt must be a string or null");

  if ("dialogue" in fields && fields.dialogue !== null) {
    const dialogue = fields.dialogue;
    if (!Array.isArray(dialogue))
      throw new ShotEditError("dialogue must be a list or null");
    if (dialogue.length > MAX_DIALOGUE_TURNS)
      throw new ShotEditError(
        `dialogue has too many turns (max ${MAX_DIALOGUE_TURNS})`,
        SHOT_EDIT_STATUS.unprocessable
      );
    let spokenCharacters = 0;
    dialogue.forEach((turn, index) => {
      if (!isRecord(turn))
        throw new ShotEditError(`dialogue[${index}] must be an object`);
      const unknownTurnFields = Object.keys(turn).filter(
        (field) => !ALLOWED_TURN_FIELDS.has(field)
      );
      if (unknownTurnFields.length)
        throw new ShotEditError(
          `dialogue[${index}] has unknown field(s): ${unknownTurnFields.sort().join(", ")}`
        );
      if (typeof turn.line !== "string" || !turn.line.trim())
        throw new ShotEditError(
          `dialogue[${index}].line must be a non-empty string`
        );
      spokenCharacters += turn.line.trim().length;
      for (const field of ["speaker", "speaker_token", "language"]) {
        if (
          turn[field] !== null &&
          turn[field] !== undefined &&
          typeof turn[field] !== "string"
        )
          throw new ShotEditError(
            `dialogue[${index}].${field} must be a string or null`
          );
      }
    });
    if (spokenCharacters > MAX_DIALOGUE_CHARACTERS)
      throw new ShotEditError(
        `dialogue has ${spokenCharacters} spoken characters (max ${MAX_DIALOGUE_CHARACTERS})`,
        SHOT_EDIT_STATUS.unprocessable
      );
  }

  if ("duration_s" in fields && fields.duration_s !== null) {
    const duration = fields.duration_s;
    if (typeof duration !== "number" || !Number.isFinite(duration))
      throw new ShotEditError("duration_s must be a positive number or null");
    if (duration <= 0) throw new ShotEditError("duration_s must be positive");
  }

  if (
    "prompt_rewrite" in fields &&
    fields.prompt_rewrite !== null &&
    !(PROMPT_REWRITE_SETTINGS as readonly unknown[]).includes(
      fields.prompt_rewrite
    )
  )
    throw new ShotEditError(
      `prompt_rewrite must be one of: ${PROMPT_REWRITE_SETTINGS.join(", ")}, or null`
    );

  if ("tags" in fields) {
    const tags = fields.tags;
    if (!isRecord(tags)) throw new ShotEditError("tags must be an object");
    for (const [group, tokens] of Object.entries(tags)) {
      if (!(TAG_GROUPS as readonly string[]).includes(group))
        throw new ShotEditError(`tags has unknown group '${group}'`);
      if (
        !Array.isArray(tokens) ||
        tokens.some((token) => typeof token !== "string")
      )
        throw new ShotEditError(`tags.${group} must be a list of strings`);
      const missing = (tokens as string[]).filter(
        (token) => !context.taggableTokens.has(token)
      );
      if (missing.length)
        throw new ShotEditError(
          `tags.${group} names entities this project cannot use: ${missing.sort().join(", ")}`
        );
    }
  }

  if (fields.locked && !context.hasRenders)
    throw new ShotEditError("A shot with no renders cannot be locked");

  if ("dialogue" in fields && Array.isArray(fields.dialogue)) {
    const currentTags = isRecord(context.shot.tags) ? context.shot.tags : {};
    const requestedTags = isRecord(fields.tags) ? fields.tags : {};
    const characterTokens = new Set(
      (Array.isArray(requestedTags.characters)
        ? requestedTags.characters
        : Array.isArray(currentTags.characters)
          ? currentTags.characters
          : []
      ).map(textOf)
    );
    (fields.dialogue as JsonRecord[]).forEach((turn, index) => {
      const speakerToken = turn.speaker_token;
      if (speakerToken && !characterTokens.has(textOf(speakerToken)))
        throw new ShotEditError(
          `dialogue[${index}].speaker_token '${textOf(speakerToken)}' is not a character tagged in this shot`
        );
    });
  }

  if ("tags" in fields) {
    const merged = {
      ...(isRecord(context.shot.tags) ? context.shot.tags : {}),
      ...(fields.tags as JsonRecord)
    };
    const countError = tagCountError(merged);
    if (countError)
      throw new ShotEditError(countError, SHOT_EDIT_STATUS.unprocessable);
  }
};

const editedShotFields = (shot: JsonRecord): Set<string> => {
  if ("edited_fields" in shot)
    return new Set(
      Array.isArray(shot.edited_fields) ? shot.edited_fields.map(textOf) : []
    );
  return shot.edited
    ? new Set(["video_prompt", "tags", "duration_s"])
    : new Set();
};

/** Applies a validated edit in place (not `shot_index` or `hidden`). */
export const applyShotEdit = (
  shot: JsonRecord,
  fields: JsonRecord
): JsonRecord => {
  const edited = editedShotFields(shot);
  if (typeof fields.heading === "string") {
    shot.heading = fields.heading.trim();
    shot.heading_edited = true;
  }
  if ("video_prompt" in fields) {
    shot.video_prompt = fields.video_prompt;
    edited.add("video_prompt");
  }
  if ("dialogue" in fields) {
    if (fields.dialogue === null) {
      const cast = Array.isArray(shot.cast_dialogue)
        ? shot.cast_dialogue
        : shot.dialogue;
      shot.dialogue = (Array.isArray(cast) ? cast : []).map((turn) => ({
        ...(turn as JsonRecord)
      }));
      edited.delete("dialogue");
    } else {
      shot.dialogue = (fields.dialogue as JsonRecord[]).map((turn) => ({
        ...turn
      }));
      edited.add("dialogue");
    }
  }
  if ("tags" in fields) {
    const tags: JsonRecord = { ...(isRecord(shot.tags) ? shot.tags : {}) };
    for (const group of TAG_GROUPS) {
      const requested = (fields.tags as JsonRecord)[group];
      if (Array.isArray(requested)) tags[group] = [...requested];
    }
    shot.tags = tags;
    edited.add("tags");
  }
  if ("sequential" in fields) {
    if (fields.sequential === null) delete shot.sequential;
    else shot.sequential = { ...(fields.sequential as JsonRecord) };
  }
  if ("duration_s" in fields) {
    shot.duration_s =
      fields.duration_s !== null
        ? fields.duration_s
        : (shot.atomic_duration_s ?? null);
    if (fields.duration_s === null) edited.delete("duration_s");
    else edited.add("duration_s");
  }
  if ("prompt_rewrite" in fields) {
    if (fields.prompt_rewrite === null) delete shot.prompt_rewrite;
    else shot.prompt_rewrite = fields.prompt_rewrite;
  }
  if ("locked" in fields) {
    if (fields.locked) shot.locked = true;
    else delete shot.locked;
  }
  const isContentEdit = Object.keys(fields).some(
    (field) => !FIELDS_THAT_ARE_NOT_SHOT_EDITS.has(field)
  );
  if (isContentEdit) {
    shot.edited = true;
    shot.edited_fields = [...edited].sort();
    if (isRecord(shot.predecessor_baseline))
      shot.predecessor_baseline = {
        ...shot.predecessor_baseline,
        edited: true
      };
  }
  return shot;
};

/** The continuation text in effect, or null. */
export const sequentialPrompt = (shot: JsonRecord): string | null => {
  const [config] = sequentialShotConfig(shot.sequential, null, null);
  return config ? String(config.prompt_appendix) : null;
};

/** The PATCH response body (`shots` is added by the caller after a move or hide). */
export const editedShotResponse = (shot: JsonRecord): JsonRecord => ({
  timeline_id: shot.timeline_id,
  shot_index: shot.shot_index ?? null,
  heading: shot.heading ?? null,
  locked: !!shot.locked,
  hidden: !!shot.hidden,
  video_prompt: shot.video_prompt ?? null,
  dialogue: Array.isArray(shot.dialogue) ? shot.dialogue : [],
  tags: shot.tags ?? null,
  duration_s: shot.duration_s ?? null,
  sequential: shot.sequential ?? null,
  sequential_prompt: sequentialPrompt(shot),
  prompt_rewrite: shot.prompt_rewrite ?? null,
  edited: shot.edited ?? null
});
