const MAX_REASON_LENGTH = 300;
const REASON_FIELDS = ["message", "error", "detail", "reason"] as const;
const GENERIC_INGESTION_FAILURE = "Cloud ingestion failed for this video";

const readableReason = (payload: unknown): string | null => {
  if (typeof payload === "string") return payload.trim() || null;
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  for (const field of REASON_FIELDS) {
    const nestedReason = readableReason(record[field]);
    if (nestedReason) return nestedReason;
  }
  const serializedPayload = JSON.stringify(payload);
  return serializedPayload === "{}" || serializedPayload === "[]"
    ? null
    : serializedPayload.slice(0, MAX_REASON_LENGTH);
};

export const describeIngestionErrorPayload = (payload: unknown): string =>
  readableReason(payload) ?? GENERIC_INGESTION_FAILURE;
