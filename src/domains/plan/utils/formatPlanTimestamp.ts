export function formatPlanTimestamp(
  ts: string | null | undefined
): string | null {
  if (!ts) return null;
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return ts;
  return date.toLocaleString();
}
