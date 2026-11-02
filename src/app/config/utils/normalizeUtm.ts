export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content"
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];

export type UtmMetadata = Record<UtmKey, string | null>;

export const normalizeUtm = (
  partial: Partial<Record<UtmKey, string | null>>
): UtmMetadata =>
  Object.fromEntries(
    UTM_KEYS.map((key) => [key, partial[key] ?? null])
  ) as UtmMetadata;
