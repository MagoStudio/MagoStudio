/**
 * Project visual treatment, applied without changing a render's subject or
 * action: the backend. The style lives in the
 * project's `settings.visual_style`, as on the cloud.
 */

export const MAX_VISUAL_STYLE_LENGTH = 8000;

export const VISUAL_STYLE_SETTING_KEY = "visual_style";

export const visualStyleError = (value: unknown): string | null => {
  if (value !== null && value !== undefined && typeof value !== "string")
    return "settings.visual_style must be a string or null";
  if (typeof value === "string" && value.length > MAX_VISUAL_STYLE_LENGTH)
    return `settings.visual_style must be at most ${MAX_VISUAL_STYLE_LENGTH} characters`;
  return null;
};

export const applyVisualStyle = (
  prompt: string,
  visualStyle: unknown
): string => {
  if (typeof visualStyle !== "string" || !visualStyle.trim()) return prompt;
  const instruction =
    "Apply only this visual treatment (medium, palette, texture, contrast, grain, and " +
    "lighting treatment). Do not add or change any subject, character, object, setting, " +
    "background, composition, or action based on this text: " +
    visualStyle.trim();
  if ((prompt || "").endsWith(instruction)) return prompt;
  return `${prompt || ""}\n\n${instruction}`;
};

/** The style a render uses: the trimmed setting, or "" when none is set. */
export const readProjectVisualStyle = (
  settings: Record<string, unknown> | null | undefined
): string => {
  const value = settings?.[VISUAL_STYLE_SETTING_KEY];
  return typeof value === "string" ? value.trim() : "";
};

/** The cast's style, only when the project never had one. */
export const castVisualStyleSeed = (
  settings: Record<string, unknown> | null | undefined,
  castVisualStyle: unknown
): string | null => {
  if (settings && VISUAL_STYLE_SETTING_KEY in settings) return null;
  if (typeof castVisualStyle !== "string" || !castVisualStyle.trim())
    return null;
  if (visualStyleError(castVisualStyle) !== null) return null;
  return castVisualStyle.trim();
};
