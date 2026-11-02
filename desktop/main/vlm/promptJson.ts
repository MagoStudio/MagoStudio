/**
 * Lenient JSON extraction for VLM output.
 *
 * The caption templates all end with "output only the JSON object", and Gemini
 * complied closely enough that the cloud code could get away with a fenced-block
 * strip plus JSON.parse. Qwen3-VL-2B is materially chattier — it
 * likes a leading "Here is the JSON:" and the occasional trailing note — so we
 * locate the outermost balanced object instead of trusting the whole response.
 */

const FENCE = /^```(?:json)?\s*([\s\S]*?)\s*```$/;

const stripFence = (text: string): string => {
  const trimmed = text.trim();
  const match = FENCE.exec(trimmed);
  return match ? match[1]!.trim() : trimmed;
};

/**
 * Find the first complete `{...}` object, respecting strings and escapes so a
 * brace inside a description doesn't end the scan early.
 */
const firstBalancedObject = (text: string): string | null => {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index]!;
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      if (inString) escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return null;
};

/** Parse a JSON object out of model output, or null if there isn't one. */
export const extractJsonObject = (
  text: string
): Record<string, unknown> | null => {
  const candidate = firstBalancedObject(stripFence(text));
  if (!candidate) return null;
  try {
    const parsed: unknown = JSON.parse(candidate);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const asText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export type StructuredPrompt = {
  positive: {
    content: string;
    setting: string;
    style: string;
    references: string;
  };
  negative: string;
};

const EMPTY_STRUCTURED_PROMPT: StructuredPrompt = {
  positive: { content: "", setting: "", style: "", references: "" },
  negative: ""
};

/**
 * Project a parsed caption object onto the shape the frontend reads
 * (`AssetPromptResponse`).
 *
 * `video.txt` adds an `action` field that `style.txt` doesn't have, and the
 * frontend has no slot for it — it is folded into `content` so the motion
 * description isn't lost, which is what makes `motionDescription` in
 * AutoPrompt/index.tsx useful for the video2video path.
 */
export const toStructuredPrompt = (
  parsed: Record<string, unknown> | null
): StructuredPrompt | null => {
  if (!parsed) return null;
  const positive = parsed.positive;
  if (typeof positive === "string") {
    const content = positive.trim();
    if (!content) return null;
    return {
      positive: { ...EMPTY_STRUCTURED_PROMPT.positive, content },
      negative: asText(parsed.negative)
    };
  }
  if (!positive || typeof positive !== "object" || Array.isArray(positive))
    return null;
  const fields = positive as Record<string, unknown>;
  const content = [asText(fields.content), asText(fields.action)]
    .filter(Boolean)
    .join(" ");
  const setting = asText(fields.setting);
  const style = asText(fields.style);
  // Reject a shell with none of the three fields the frontend actually renders
  // (see formatPromptFromResponse). Returning an all-empty prompt here would
  // read as success: no retry, and an empty caption persisted to
  // asset.data.prompt forever, which also leaves motionDescription blank and
  // keeps the video2video AutoPrompt permanently disabled for that asset.
  if (!content && !setting && !style) return null;
  return {
    positive: {
      content,
      setting,
      style,
      references: asText(fields.references)
    },
    negative: asText(parsed.negative)
  };
};

/**
 * Validate an already-persisted `asset.data.prompt` before trusting it as a
 * cache hit. A truthiness check isn't enough: a prompt written by an older
 * build (or by the cloud) could be an empty shell, and treating that as
 * captioned would mean the asset never gets a real caption.
 */
export const readCachedPrompt = (value: unknown): StructuredPrompt | null => {
  if (typeof value === "string")
    return toStructuredPrompt({ positive: value, negative: "" });
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return toStructuredPrompt(value as Record<string, unknown>);
};

/** Pull the single-string `positive` an AutoPrompt template returns. */
export const toPositivePrompt = (
  parsed: Record<string, unknown> | null
): string | null => {
  if (!parsed) return null;
  const positive = parsed.positive;
  if (typeof positive === "string") return positive.trim() || null;
  if (positive && typeof positive === "object" && !Array.isArray(positive)) {
    const content = asText((positive as Record<string, unknown>).content);
    return content || null;
  }
  return null;
};
