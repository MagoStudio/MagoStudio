const isPrimitive = (value: unknown): value is string | number | boolean =>
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean";

export function formatMetricRows(
  details: Record<string, unknown>
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  for (const [key, value] of Object.entries(details)) {
    if (isPrimitive(value)) {
      rows.push({ label: key, value: String(value) });
    } else if (Array.isArray(value) && value.length > 0) {
      rows.push({ label: key, value: value.map(String).join(", ") });
    } else if (value && typeof value === "object" && "message" in value) {
      rows.push({
        label: key,
        value: String((value as { message: unknown }).message)
      });
    }
  }
  return rows;
}
