/**
 * Reads cloud render progress from the queue.
 *
 * `GET /assets/{id}` only says "pending" or hands over a URL, so it cannot tell
 * a queued render from a running one and carries no timing. The queue does:
 * `GET /queue/project/{cloudProjectId}` returns one item per render with a real
 * status, keyed by the output asset id, plus the timestamps needed to show
 * elapsed time. One request covers every job in a project.
 *
 * Shapes verified against staging.
 */

export interface CloudQueueItem {
  id: string;
  status: string;
  assetId: string;
  createdAt: string | null;
  renderStartedAt: string | null;
  finishedAt: string | null;
  progress: number | null;
  /** Whatever the server recorded about a failure. Often nothing. */
  failure: string | null;
}

/** The local job status a queue status maps to. */
export type CloudJobStatus =
  | "INQUEUE"
  | "INPROGRESS"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";

const FINISHED_STATUSES = new Set(["FINISHED", "SUCCESS", "COMPLETED", "DONE"]);
const FAILED_STATUSES = new Set(["FAILED", "ERROR", "TIMEOUT"]);
const CANCELLED_STATUSES = new Set(["CANCELLED", "CANCELED", "ENDED"]);
const RUNNING_STATUSES = new Set(["INPROGRESS", "RUNNING", "STARTED"]);
const QUEUED_STATUSES = new Set([
  "INQUEUE",
  "PENDING",
  "QUEUED",
  "WAITING",
  "PAUSED"
]);

const asString = (value: unknown): string | null =>
  typeof value === "string" && value ? value : null;

/**
 * The queue returns `created_at` with an offset but `render_started_at` and
 * `finished_at` without one. JavaScript parses a naive ISO string as *local*
 * time, which would skew every elapsed time by the viewer's UTC offset, so an
 * absent timezone is read as UTC -- which is what the server means.
 */
export const parseServerTimestamp = (value: string | null): number | null => {
  if (!value) return null;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value.trim());
  const parsed = Date.parse(hasZone ? value : `${value}Z`);
  return Number.isNaN(parsed) ? null : parsed;
};

/**
 * The reason a render failed, if the server recorded one.
 *
 * Three fields can carry it -- `rejected_reason`, `server_error`, `error` -- and
 * in practice all three are often empty even for a failed render, because the
 * detail stays in the renderer's own logs. Returning null then is honest: the UI
 * should say the render failed without inventing a cause.
 */
const readFailure = (record: Record<string, unknown>): string | null => {
  for (const key of ["rejected_reason", "server_error", "error"]) {
    const value = record?.[key];
    if (typeof value === "string" && value.trim()) return value;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = value as Record<string, unknown>;
      const message = nested.message ?? nested.detail ?? nested.error;
      if (typeof message === "string" && message.trim()) return message;
    }
  }
  return null;
};

export const parseQueueItems = (response: unknown): CloudQueueItem[] => {
  const rows = Array.isArray(response)
    ? response
    : Array.isArray((response as { items?: unknown })?.items)
      ? ((response as { items: unknown[] }).items as unknown[])
      : [];

  const items: CloudQueueItem[] = [];
  for (const row of rows) {
    const record = row as Record<string, unknown>;
    const id = asString(record?.id);
    const assetId = asString(record?.asset_id);
    if (!id || !assetId) continue;
    items.push({
      id,
      status: asString(record?.status) ?? "",
      assetId,
      createdAt: asString(record?.created_at),
      renderStartedAt: asString(record?.render_started_at),
      finishedAt: asString(record?.finished_at),
      progress: typeof record?.progress === "number" ? record.progress : null,
      failure: readFailure(record)
    });
  }
  return items;
};

/**
 * Anything unrecognised counts as still queued rather than finished, so a new
 * server-side status can never make a job look done before its output exists.
 * `render_started_at` is no evidence of running: prod fills a missing one with
 * the current time.
 */
export const toJobStatus = (item: CloudQueueItem): CloudJobStatus => {
  const status = item.status.trim().toUpperCase();
  if (FINISHED_STATUSES.has(status)) return "SUCCESS";
  if (FAILED_STATUSES.has(status)) return "FAILED";
  if (CANCELLED_STATUSES.has(status)) return "CANCELLED";
  if (RUNNING_STATUSES.has(status)) return "INPROGRESS";
  if (QUEUED_STATUSES.has(status)) return "INQUEUE";
  return "INQUEUE";
};

export const findQueueItemForAsset = (
  response: unknown,
  cloudAssetId: string
): CloudQueueItem | null =>
  parseQueueItems(response).find((item) => item.assetId === cloudAssetId) ??
  null;

/** Position in the queue among items not yet started, 1-based; null if running. */
export const queuePositionForAsset = (
  response: unknown,
  cloudAssetId: string
): number | null => {
  const waiting = parseQueueItems(response)
    .filter((item) => toJobStatus(item) === "INQUEUE")
    .sort((left, right) =>
      (left.createdAt ?? "").localeCompare(right.createdAt ?? "")
    );
  const index = waiting.findIndex((item) => item.assetId === cloudAssetId);
  return index === -1 ? null : index + 1;
};

export const elapsedRenderMs = (
  item: CloudQueueItem,
  now: number
): number | null => {
  const hasRenderStarted = toJobStatus(item) !== "INQUEUE";
  if (!hasRenderStarted) return null;
  const started = parseServerTimestamp(item.renderStartedAt);
  if (started === null) return null;
  const end = item.finishedAt ? parseServerTimestamp(item.finishedAt) : now;
  return end === null ? null : Math.max(0, end - started);
};
