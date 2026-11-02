export const formatTrackingValue = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value.toString();
  }
  return JSON.stringify(value);
};
