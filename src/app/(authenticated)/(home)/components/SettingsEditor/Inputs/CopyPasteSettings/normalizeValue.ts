const KEEP_AS_ARRAY_KEYS = new Set<string>(["image_ids"]);

export const normalizeValue = (value: unknown, key?: string): unknown => {
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    if (value.length > 0 && Array.isArray(value[0])) {
      return normalizeValue(value[0], key);
    }

    if (value.length === 1 && typeof value[0] === "string") {
      if (key && KEEP_AS_ARRAY_KEYS.has(key)) {
        return value;
      }
      return value[0];
    }

    if (value.every((item) => typeof item === "string")) {
      return value;
    }
  }

  return value;
};
