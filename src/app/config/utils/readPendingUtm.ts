import { normalizeUtm, UTM_KEYS, UtmMetadata } from "./normalizeUtm";

const isKnownUtmKey = (key: string): boolean =>
  (UTM_KEYS as readonly string[]).includes(key);

const isStringOrNull = (value: unknown): boolean =>
  value === null || typeof value === "string";

export const readPendingUtm = (raw: string | null): UtmMetadata | null => {
  if (!raw) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const isPlainObject =
    typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
  if (!isPlainObject) {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  const keys = Object.keys(record);
  const hasOnlyKnownKeys = keys.every(isKnownUtmKey);
  const hasOnlyValidValues = keys.every((key) => isStringOrNull(record[key]));
  const hasAnyValue = UTM_KEYS.some((key) => typeof record[key] === "string");

  if (!hasOnlyKnownKeys || !hasOnlyValidValues || !hasAnyValue) {
    return null;
  }

  return normalizeUtm(record as Partial<UtmMetadata>);
};
