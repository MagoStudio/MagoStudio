import { AssetStatus } from "@schemas/asset";

import { parseQueueItems, toJobStatus } from "./queueStatus";

/**
 * Presents cloud renders as entries in the app's own render queue.
 *
 * The queue UI already knows how to show position, progress, an ETA and an error
 * — it just matches a track by the **local** asset id of its clip. A cloud queue
 * item carries cloud ids, so the only thing needed is to swap them for the local
 * ones recorded on the job. Nothing new has to be drawn.
 */

export interface ActiveCloudJob {
  id: string;
  cloudAssetId: string | null;
  assetId: string;
  trackId: string;
  clipId: string;
  projectId: string;
  shotId: string;
  model: string;
  status: string;
}

/** Shaped like the app's QueueItem, with only the fields the UI reads. */
export interface LocalisedQueueItem {
  id: string;
  queue_id: string;
  asset_id: string;
  layer_id: string;
  project_id: string;
  timeline_id: string;
  project_name: string;
  timeline_name: string;
  layer_name: string;
  frame_range: [number, number];
  price: number;
  active: boolean;
  created_at: string;
  render_started_at: string;
  finished_at: string;
  order: number;
  show_done: boolean;
  interacted_with: boolean;
  user_id: string;
  render_model: string;
  render_provider: "mago-cloud";
  status: AssetStatus;
  progress: number;
  display_order?: number;
  ETA?: number;
  error?: { error_message: string };
}

const STATUS_MAP: Record<string, AssetStatus> = {
  INQUEUE: AssetStatus.INQUEUE,
  INPROGRESS: AssetStatus.INPROGRESS,
  SUCCESS: AssetStatus.FINISHED,
  FAILED: AssetStatus.ERROR,
  CANCELLED: AssetStatus.CANCELLED
};

const numberOrUndefined = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const numberOr = (value: unknown, fallback: number): number =>
  numberOrUndefined(value) ?? fallback;

const stringOr = (value: unknown, fallback: string): string =>
  typeof value === "string" && value ? value : fallback;

const frameRangeOrDefault = (value: unknown): [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((frame) => typeof frame === "number" && Number.isFinite(frame))
    ? [value[0], value[1]]
    : [0, 0];

export const toLocalQueueItems = (
  cloudQueue: unknown,
  jobs: readonly ActiveCloudJob[]
): LocalisedQueueItem[] => {
  if (jobs.length === 0) return [];

  const byCloudAsset = new Map<string, ActiveCloudJob>();
  for (const job of jobs) {
    if (job.cloudAssetId) byCloudAsset.set(job.cloudAssetId, job);
  }
  if (byCloudAsset.size === 0) return [];

  const raw = Array.isArray(cloudQueue) ? cloudQueue : [];
  const rawById = new Map<string, Record<string, unknown>>();
  for (const entry of raw) {
    const record = entry as Record<string, unknown>;
    const id = record?.id;
    if (typeof id === "string") rawById.set(id, record);
  }

  const items: LocalisedQueueItem[] = [];
  for (const parsed of parseQueueItems(cloudQueue)) {
    const job = byCloudAsset.get(parsed.assetId);
    if (!job) continue; // Someone else's render, or one we do not track.

    const record = rawById.get(parsed.id) ?? {};
    const createdAt = stringOr(record.created_at, new Date(0).toISOString());
    items.push({
      id: parsed.id,
      queue_id: stringOr(record.queue_id, parsed.id),
      // The swap that makes the existing UI find this render.
      asset_id: job.assetId,
      layer_id: job.trackId,
      project_id: job.projectId,
      timeline_id: job.shotId,
      project_name: stringOr(record.project_name, "Mago cloud project"),
      timeline_name: stringOr(record.timeline_name, "Shot"),
      layer_name: stringOr(record.layer_name, job.model),
      frame_range: frameRangeOrDefault(record.frame_range),
      price: numberOr(record.price, 0),
      active: typeof record.active === "boolean" ? record.active : true,
      created_at: createdAt,
      render_started_at: stringOr(record.render_started_at, createdAt),
      finished_at: stringOr(record.finished_at, createdAt),
      order: numberOr(record.order, 0),
      show_done:
        typeof record.show_done === "boolean" ? record.show_done : false,
      interacted_with:
        typeof record.interacted_with === "boolean"
          ? record.interacted_with
          : false,
      user_id: stringOr(record.user_id, "cloud"),
      render_model: job.model,
      render_provider: "mago-cloud",
      status: STATUS_MAP[toJobStatus(parsed)] ?? AssetStatus.PENDING,
      progress: parsed.progress ?? 0,
      display_order: numberOrUndefined(record.display_order),
      ETA: numberOrUndefined(record.ETA),
      ...(parsed.failure ? { error: { error_message: parsed.failure } } : {})
    });
  }
  return items;
};
