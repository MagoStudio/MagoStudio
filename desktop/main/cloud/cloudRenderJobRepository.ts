import { and, asc, eq, inArray } from "drizzle-orm";

import type { LocalQueueItem } from "../../shared/contracts";
import { DatabaseManager } from "../database/databaseManager";
import {
  assets,
  clips,
  cloudRenderJobs,
  projects,
  shots,
  tracks
} from "../database/schema";

/**
 * Tracks renders submitted to cloud Mago.
 *
 * Rows outlive the window: the renderer does the polling because it holds the
 * auth token, but the job list lives here so quitting mid-render loses nothing
 * and the next launch can resume watching.
 */

export const ACTIVE_CLOUD_RENDER_STATUSES = [
  "PENDING",
  "INQUEUE",
  "INPROGRESS"
] as const;

export interface CloudRenderJobRow {
  id: string;
  cloudAssetId: string | null;
  /** Set for an img2img job: what `GET /assets/img2img/status/{id}` polls by. */
  cloudClipId: string | null;
  model: string;
  projectId: string;
  shotId: string;
  trackId: string;
  clipId: string;
  assetId: string;
  status: string;
  progress: number;
  error: string | null;
  request: Record<string, unknown>;
}

const toRow = (row: typeof cloudRenderJobs.$inferSelect): CloudRenderJobRow => {
  let request: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(row.requestJson) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      request = parsed as Record<string, unknown>;
    }
  } catch {
    request = {};
  }
  return {
    id: row.id,
    cloudAssetId: row.cloudAssetId ?? null,
    cloudClipId: row.cloudClipId ?? null,
    model: row.model,
    projectId: row.projectId,
    shotId: row.shotId,
    trackId: row.trackId,
    clipId: row.clipId,
    assetId: row.assetId,
    status: row.status,
    progress: row.progress,
    error: row.error ?? null,
    request
  };
};

const parseJsonRecord = (
  value: string | null | undefined
): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(value ?? "{}") as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

export const readStoredCloudOutputLayerId = (
  request: Record<string, unknown>
): string | null =>
  typeof request.cloudOutputLayerId === "string" && request.cloudOutputLayerId
    ? request.cloudOutputLayerId
    : null;

export class CloudRenderJobRepository {
  constructor(private readonly manager: DatabaseManager) {}

  async create(input: {
    id: string;
    cloudAssetId?: string | null;
    cloudClipId?: string | null;
    model: string;
    projectId: string;
    shotId: string;
    trackId: string;
    clipId: string;
    assetId: string;
    request: Record<string, unknown>;
  }): Promise<void> {
    const now = new Date();
    await this.manager
      .get()
      .insert(cloudRenderJobs)
      .values({
        id: input.id,
        cloudAssetId: input.cloudAssetId ?? null,
        cloudClipId: input.cloudClipId ?? null,
        model: input.model,
        projectId: input.projectId,
        shotId: input.shotId,
        trackId: input.trackId,
        clipId: input.clipId,
        assetId: input.assetId,
        status: "PENDING",
        progress: 0,
        requestJson: JSON.stringify(input.request),
        startedAt: now,
        createdAt: now,
        updatedAt: now
      });
  }

  /** Jobs the renderer should still be watching, including after a restart. */
  async listActive(): Promise<CloudRenderJobRow[]> {
    const rows = await this.manager
      .get()
      .select()
      .from(cloudRenderJobs)
      .where(
        inArray(cloudRenderJobs.status, [...ACTIVE_CLOUD_RENDER_STATUSES])
      );
    return rows.map(toRow);
  }

  /**
   * Every cloud job, including completed history, shaped for the shared Queue.
   * Polling intentionally uses listActive; the Queue must not, otherwise a
   * successful render disappears at the exact moment it finishes.
   */
  async listQueue(): Promise<LocalQueueItem[]> {
    const rows = await this.manager
      .get()
      .select()
      .from(cloudRenderJobs)
      .orderBy(asc(cloudRenderJobs.createdAt));
    const activeIds = new Set(
      rows
        .filter((job) =>
          ACTIVE_CLOUD_RENDER_STATUSES.includes(
            job.status as (typeof ACTIVE_CLOUD_RENDER_STATUSES)[number]
          )
        )
        .map((job) => job.id)
    );
    const queuePositions = new Map(
      [...activeIds].map((id, index) => [id, index + 1])
    );

    return Promise.all(
      rows.map(async (job, index) => {
        const [[project], [shot], [track]] = await Promise.all([
          this.manager
            .get()
            .select({ name: projects.name })
            .from(projects)
            .where(eq(projects.id, job.projectId))
            .limit(1),
          this.manager
            .get()
            .select({ name: shots.name })
            .from(shots)
            .where(eq(shots.id, job.shotId))
            .limit(1),
          this.manager
            .get()
            .select({ name: tracks.name })
            .from(tracks)
            .where(eq(tracks.id, job.trackId))
            .limit(1)
        ]);
        const request = toRow(job).request;
        const isImageRenderJob = request.kind === "img2img";
        const frameRange = Array.isArray(request.frameRange)
          ? request.frameRange
          : [request.frame ?? 0, request.frame ?? 0];
        const status =
          job.status === "SUCCESS"
            ? "FINISHED"
            : job.status === "FAILED"
              ? "ERROR"
              : job.status;
        return {
          id: job.id,
          queue_id: job.id,
          cloud_asset_id: job.cloudAssetId,
          cloud_output_layer_id: readStoredCloudOutputLayerId(request),
          asset_id: job.assetId,
          clip_id: job.clipId,
          layer_id: job.trackId,
          project_id: job.projectId,
          timeline_id: job.shotId,
          project_name: project?.name ?? "Local project",
          timeline_name: shot?.name ?? "Shot",
          layer_name: track?.name ?? job.model,
          frame_range: frameRange,
          price: 0,
          active: activeIds.has(job.id),
          created_at: job.createdAt.toISOString(),
          render_started_at: (job.startedAt ?? job.createdAt).toISOString(),
          finished_at: (job.finishedAt ?? job.updatedAt).toISOString(),
          order: index,
          show_done: true,
          interacted_with: job.interacted,
          user_id: "cloud",
          render_model: job.model,
          render_provider: "mago-cloud",
          kind: isImageRenderJob ? "image" : "video",
          data: {
            ...(isImageRenderJob ? { frame: request.frame } : {}),
            settings: request.settings,
            status: job.status
          },
          status,
          progress: job.progress,
          display_order: queuePositions.get(job.id),
          isCancelable: false,
          ...(job.error
            ? {
                error: {
                  error_type: "cloud_provider_error",
                  error_message: job.error
                }
              }
            : {})
        };
      })
    );
  }

  async get(jobId: string): Promise<CloudRenderJobRow | null> {
    const [row] = await this.manager
      .get()
      .select()
      .from(cloudRenderJobs)
      .where(eq(cloudRenderJobs.id, jobId))
      .limit(1);
    return row ? toRow(row) : null;
  }

  async update(
    jobId: string,
    patch: {
      status?: string;
      progress?: number;
      cloudAssetId?: string | null;
      error?: string | null;
      finished?: boolean;
    }
  ): Promise<void> {
    const now = new Date();
    await this.manager
      .get()
      .update(cloudRenderJobs)
      .set({
        ...(patch.status === undefined ? {} : { status: patch.status }),
        ...(patch.progress === undefined ? {} : { progress: patch.progress }),
        ...(patch.cloudAssetId === undefined
          ? {}
          : { cloudAssetId: patch.cloudAssetId }),
        ...(patch.error === undefined ? {} : { error: patch.error }),
        ...(patch.finished ? { finishedAt: now } : {}),
        updatedAt: now
      })
      .where(eq(cloudRenderJobs.id, jobId));
  }

  async cancelActive(jobId: string): Promise<void> {
    const job = await this.get(jobId);
    const isCloudRenderJobActive =
      job !== null &&
      ACTIVE_CLOUD_RENDER_STATUSES.includes(
        job.status as (typeof ACTIVE_CLOUD_RENDER_STATUSES)[number]
      );
    if (!isCloudRenderJobActive) return;

    const now = new Date();
    await this.manager.transaction(async (database) => {
      await database
        .update(cloudRenderJobs)
        .set({ status: "CANCELLED", finishedAt: now, updatedAt: now })
        .where(eq(cloudRenderJobs.id, job.id));
      const [asset] = await database
        .select({ dataJson: assets.dataJson })
        .from(assets)
        .where(eq(assets.id, job.assetId))
        .limit(1);
      await database
        .update(assets)
        .set({
          status: "CANCELLED",
          dataJson: JSON.stringify({
            ...parseJsonRecord(asset?.dataJson),
            queue_status: "CANCELLED"
          }),
          updatedAt: now
        })
        .where(eq(assets.id, job.assetId));
      const [clip] = await database
        .select({ dataJson: clips.dataJson })
        .from(clips)
        .where(eq(clips.id, job.clipId))
        .limit(1);
      await database
        .update(clips)
        .set({
          dataJson: JSON.stringify({
            ...parseJsonRecord(clip?.dataJson),
            status: "cancelled"
          }),
          updatedAt: now
        })
        .where(eq(clips.id, job.clipId));
    });
  }

  async markInteracted(jobId: string): Promise<void> {
    await this.manager
      .get()
      .update(cloudRenderJobs)
      .set({ interacted: true, updatedAt: new Date() })
      .where(eq(cloudRenderJobs.id, jobId));
  }

  async deleteForClip(clipId: string): Promise<void> {
    await this.manager
      .get()
      .delete(cloudRenderJobs)
      .where(and(eq(cloudRenderJobs.clipId, clipId)));
  }
}
