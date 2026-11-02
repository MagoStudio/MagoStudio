const MAX_SHEET_TOKEN_LENGTH = 200;

/** Mirrors the backend's sheet-token normalisation: the token the
 * group is keyed by, so the name the user typed and the group it creates cannot disagree. */
export const normaliseSheetToken = (raw: string): string | null => {
  const token = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return token.slice(0, MAX_SHEET_TOKEN_LENGTH) || null;
};
