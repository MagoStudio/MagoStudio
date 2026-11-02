export interface CloudQueueRow {
  cloudQueueItemId: string | null;
  cloudQueueStatus: string | null;
  cloudOutputLayerId: string | null;
  cloudQueuePrice: number | null;
  cloudQueueEtaSeconds: number | null;
}

const asNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value ? value : null;

const asFiniteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readCloudQueueRows = (cloudQueueResponse: unknown): unknown[] => {
  if (Array.isArray(cloudQueueResponse)) return cloudQueueResponse;
  const items = (cloudQueueResponse as { items?: unknown } | null)?.items;
  return Array.isArray(items) ? items : [];
};

export const findCloudQueueRowForAsset = (
  cloudQueueResponse: unknown,
  cloudAssetId: string
): CloudQueueRow | null => {
  for (const row of readCloudQueueRows(cloudQueueResponse)) {
    const record = (row ?? {}) as Record<string, unknown>;
    const cloudQueueItemId = asNonEmptyString(record.id);
    if (!cloudQueueItemId || record.asset_id !== cloudAssetId) continue;
    return {
      cloudQueueItemId,
      cloudQueueStatus: asNonEmptyString(record.status),
      cloudOutputLayerId: asNonEmptyString(record.layer_id),
      cloudQueuePrice: asFiniteNumber(record.price),
      cloudQueueEtaSeconds: asFiniteNumber(record.ETA)
    };
  }
  return null;
};
