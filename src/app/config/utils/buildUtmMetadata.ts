import { normalizeUtm, UTM_KEYS, UtmKey, UtmMetadata } from "./normalizeUtm";

const MAX_UTM_VALUE_LENGTH = 200;

export const buildUtmMetadata = (
  search: string | URLSearchParams
): UtmMetadata | null => {
  const params =
    typeof search === "string" ? new URLSearchParams(search) : search;

  const presentValues: Partial<Record<UtmKey, string>> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim().slice(0, MAX_UTM_VALUE_LENGTH);
    if (value) {
      presentValues[key] = value;
    }
  }

  const hasAnyPresent = Object.keys(presentValues).length > 0;
  if (!hasAnyPresent) {
    return null;
  }

  return normalizeUtm(presentValues);
};
