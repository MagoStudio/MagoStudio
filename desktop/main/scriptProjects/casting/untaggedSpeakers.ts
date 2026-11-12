type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  !!value && typeof value === "object" && !Array.isArray(value);

const readText = (value: unknown): string =>
  typeof value === "string" ? value : "";

const SHEET_TOKEN_SEPARATOR = /[^a-z0-9_]+/g;
const MAX_SHEET_TOKEN_LENGTH = 200;
const CUE_EXTENSION =
  /\s*\((?:v\.?\s*o\.?|o\.?\s*s\.?|o\.?\s*c\.?|cont'?d)\)\s*/gi;

/** The backend's `sheet_groups.normalize_sheet_token`: slug form, or null. */
export const normalizeSheetToken = (raw: string): string | null => {
  const token = raw
    .trim()
    .toLowerCase()
    .replace(SHEET_TOKEN_SEPARATOR, "_")
    .replace(/^_+|_+$/g, "");
  return token.slice(0, MAX_SHEET_TOKEN_LENGTH) || null;
};

/** The backend's `voice.speaker_token`: the turn's own token, else its cue name as a token. */
export const resolveDialogueSpeakerToken = (
  turn: JsonRecord
): string | null => {
  const ownToken = turn.speaker_token;
  if (typeof ownToken === "string" && ownToken) return ownToken;
  const cueName = readText(turn.speaker).replace(CUE_EXTENSION, " ").trim();
  return normalizeSheetToken(cueName);
};

/** Every character slot of the cast, switched-off ones included, as the backend counts them. */
export const listCastCharacterTokens = (keys: unknown): Set<string> =>
  new Set(
    (Array.isArray(keys) ? keys : [])
      .filter(isRecord)
      .filter((key) => key.kind === "character")
      .map((key) => readText(key.token))
      .filter(Boolean)
  );

/**
 * The backend's `script_project.untagged_speakers`: each speaker of the dialogue not tagged
 * as a character of the shot, in first-spoken order. A turn with only a cue name counts only
 * when that name is a cast slot.
 */
export const listUntaggedSpeakers = (
  dialogue: unknown,
  tags: unknown,
  castCharacterTokens: ReadonlySet<string>
): string[] => {
  const taggedCharacters = new Set(
    isRecord(tags) && Array.isArray(tags.characters)
      ? tags.characters.map(String)
      : []
  );
  const untaggedSpeakers: string[] = [];
  for (const turn of Array.isArray(dialogue) ? dialogue : []) {
    if (!isRecord(turn) || !readText(turn.line).trim()) continue;
    const speakerToken = resolveDialogueSpeakerToken(turn);
    const isNamedOnlyByCue = !turn.speaker_token;
    const isUntaggedSpeaker =
      !!speakerToken &&
      !taggedCharacters.has(speakerToken) &&
      !untaggedSpeakers.includes(speakerToken) &&
      !(isNamedOnlyByCue && !castCharacterTokens.has(speakerToken));
    if (isUntaggedSpeaker) untaggedSpeakers.push(speakerToken);
  }
  return untaggedSpeakers;
};
