import { randomUUID } from "node:crypto";
import type { Stats } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";

import { and, asc, desc, eq, gte, inArray, sql, type SQL } from "drizzle-orm";

import type {
  LocalAsset,
  LocalAssetUpdateInput,
  LocalImageImport,
  LocalProject,
  LocalProjectListItem,
  LocalShotCreateInput,
  LocalShotUpdateInput,
  LocalTrackCreateInput,
  LocalTrackUpdateInput,
  LocalVideoImport,
  LocalVideoImportResult
} from "../../shared/contracts";
import {
  isLocalFolderDummyProject,
  OFFLINE_LOCAL_USER_ID
} from "../../shared/localFolderDummyProject";
import { visualStyleError } from "../scriptProjects/visualStyle";
import { atomicWriteFile } from "../storage/atomicFile";
import { storedObject } from "../storage/storedJson";

import { DatabaseManager } from "./databaseManager";
import { mergeBackendOwnedProjectSettings } from "./mergeBackendOwnedProjectSettings";
import { buildProjectStats, type ProjectStats } from "./projectStats";
import { readCloudMirroredTracks } from "./readCloudMirroredTracks";
import {
  assets,
  clips,
  imageRenderJobs,
  projectAssets,
  projects,
  scriptProjectSnapshots,
  shots,
  tracks
} from "./schema";

const PROJECT_NAME_MAX_LENGTH = 200;
const RENDER_TRACK_TYPE = "RENDER";

const parseJson = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

/** Keeps legacy local rows compatible with the shared cloud asset schema. */
const parseAssetData = (
  value: string,
  assetId?: string
): Record<string, unknown> => {
  let parsed: Record<string, unknown>;
  if (assetId) {
    const message = `Could not read saved data for asset ${assetId}. Original data has been kept.`;
    try {
      parsed = storedObject(value, {
        id: `asset-data:${assetId}`,
        kind: "asset",
        assetId,
        message
      });
    } catch {
      return { error: { message } };
    }
  } else parsed = parseJson<Record<string, unknown>>(value, {});
  const data =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  return typeof data.error === "string"
    ? { ...data, error: { message: data.error } }
    : data;
};

const mediaUrl = (assetId: string): string => `mago-media://asset/${assetId}`;
const thumbnailUrl = (assetId: string): string =>
  `mago-media://thumbnail/${assetId}`;
const queueStatus = (status: string): string => {
  switch (status.toUpperCase()) {
    case "AVAILABLE":
    case "SUCCESS":
      return "FINISHED";
    case "FAILED":
      return "ERROR";
    case "QUEUED":
      return "INQUEUE";
    case "PROCESSING":
    case "RUNNING":
      return "INPROGRESS";
    default:
      return status.toUpperCase();
  }
};

const assetQueueStatus = (
  asset: Pick<typeof assets.$inferSelect, "id" | "status" | "dataJson">
): string => {
  if (asset.status !== "pending") return queueStatus(asset.status);
  const assetData = parseAssetData(asset.dataJson, asset.id);
  if (!assetData.cloudMirror) return queueStatus(asset.status);
  const mirroredCloudQueueStatus = assetData.queue_status;
  return typeof mirroredCloudQueueStatus === "string" &&
    mirroredCloudQueueStatus
    ? queueStatus(mirroredCloudQueueStatus)
    : "FINISHED";
};

const isFinishedRenderClip = ({
  trackType,
  assetId,
  assetStatus,
  pendingAssetDataJson
}: {
  trackType: string;
  assetId: string;
  assetStatus: string;
  pendingAssetDataJson: string | null;
}): boolean =>
  trackType.toUpperCase() === RENDER_TRACK_TYPE &&
  assetQueueStatus({
    id: assetId,
    status: assetStatus,
    dataJson: pendingAssetDataJson ?? "{}"
  }) === "FINISHED";

const hasCloudSummaryRenderCount = (
  projectSettings: Record<string, unknown>
): boolean =>
  projectSettings.origin === "cloud" &&
  !!projectSettings.cloudSummary &&
  typeof projectSettings.cloudSummary === "object" &&
  typeof (projectSettings.cloudSummary as Record<string, unknown>)
    .total_renders === "number";

export const clipTimelineFrames = ({
  clipData,
  assetFrameCount,
  assetFps,
  timelineOffsetMs
}: {
  clipData: Record<string, unknown>;
  assetFrameCount: number;
  assetFps: number;
  timelineOffsetMs: number;
}): { duration: number; timelineOffset: number } => {
  const range = clipData.frame_range;
  if (
    Array.isArray(range) &&
    range.length === 2 &&
    range.every(
      (frame) => typeof frame === "number" && Number.isInteger(frame)
    ) &&
    range[1] >= range[0]
  ) {
    return {
      duration: range[1] - range[0],
      timelineOffset: range[0]
    };
  }
  return {
    duration: assetFrameCount,
    timelineOffset: Math.round((timelineOffsetMs / 1000) * assetFps)
  };
};

export class ProjectRepository {
  /** Serialises `mergeAssetData` — see the note there. */
  private assetDataMerges: Promise<void> = Promise.resolve();

  constructor(
    private readonly manager: DatabaseManager,
    private readonly getLibraryRoot: () => Promise<string | null>
  ) {}

  async list(): Promise<LocalProjectListItem[]> {
    if (!this.manager.isOpen()) return [];
    const database = this.manager.get();
    const projectRows = (
      await database
        .select()
        .from(projects)
        .where(eq(projects.active, true))
        .orderBy(desc(projects.updatedAt))
    ).filter((project) => !isLocalFolderDummyProject(project));

    if (!projectRows.length) return [];
    const settingsById = new Map(
      projectRows.map((project) => [
        project.id,
        this.readProjectData(project.settingsJson, project.id, "settings", true)
      ])
    );
    const projectIds = projectRows.map((project) => project.id);
    const scriptIds = projectIds.filter(
      (id) => settingsById.get(id)?.type === "script_to_shots"
    );
    const projectIdsCountingLocalRenders = projectIds.filter(
      (id) => !hasCloudSummaryRenderCount(settingsById.get(id) ?? {})
    );
    // The homepage needs summaries, not plan histories or one set of queries
    // per card. Read related rows once and group them by their owning project.
    const [snapshotRows, shotRows, assetRows, renderClipRows] =
      await Promise.all([
        scriptIds.length
          ? database
              .select({
                projectId: scriptProjectSnapshots.projectId,
                stateJson: scriptProjectSnapshots.stateJson,
                cutJson: scriptProjectSnapshots.cutJson,
                previewUrl: scriptProjectSnapshots.previewUrl
              })
              .from(scriptProjectSnapshots)
              .where(inArray(scriptProjectSnapshots.projectId, scriptIds))
          : [],
        database
          .select({ projectId: shots.projectId })
          .from(shots)
          .where(
            and(inArray(shots.projectId, projectIds), eq(shots.active, true))
          ),
        database
          .select({
            projectId: projectAssets.projectId,
            assetId: projectAssets.assetId,
            thumbnailRelativePath: assets.thumbnailRelativePath
          })
          .from(projectAssets)
          .innerJoin(assets, eq(projectAssets.assetId, assets.id))
          .where(inArray(projectAssets.projectId, projectIds)),
        projectIdsCountingLocalRenders.length > 0
          ? this.readActiveRenderClips(
              database,
              inArray(tracks.projectId, projectIdsCountingLocalRenders)
            )
          : []
      ]);
    const finishedRenderCounts = new Map<string, number>();
    for (const renderClip of renderClipRows) {
      if (!isFinishedRenderClip(renderClip)) continue;
      finishedRenderCounts.set(
        renderClip.projectId,
        (finishedRenderCounts.get(renderClip.projectId) ?? 0) + 1
      );
    }
    const snapshotsById = new Map(
      snapshotRows.map((snapshot) => [snapshot.projectId, snapshot])
    );
    const shotCounts = new Map<string, number>();
    for (const shot of shotRows)
      shotCounts.set(shot.projectId, (shotCounts.get(shot.projectId) ?? 0) + 1);
    const assetsByProject = new Map<string, typeof assetRows>();
    for (const asset of assetRows) {
      const linked = assetsByProject.get(asset.projectId) ?? [];
      linked.push(asset);
      assetsByProject.set(asset.projectId, linked);
    }
    return projectRows.map((project) => {
      const projectSettings = settingsById.get(project.id)!;
      const scriptSnapshot = snapshotsById.get(project.id);
      const scriptState = scriptSnapshot?.stateJson
        ? this.readProjectData(
            scriptSnapshot.stateJson,
            project.id,
            "script state",
            true
          )
        : null;
      const scriptCut = scriptSnapshot?.cutJson
        ? this.readProjectData(scriptSnapshot.cutJson, project.id, "cut", true)
        : null;
      const cloudSummary =
        projectSettings.origin === "cloud" &&
        projectSettings.cloudSummary &&
        typeof projectSettings.cloudSummary === "object" &&
        !Array.isArray(projectSettings.cloudSummary)
          ? (projectSettings.cloudSummary as Record<string, unknown>)
          : {};
      const projectShotCount = shotCounts.get(project.id) ?? 0;
      const linkedAssets = assetsByProject.get(project.id) ?? [];
      const previewAsset = linkedAssets.find(
        (asset) => !!asset.thumbnailRelativePath
      );
      return {
        id: project.id,
        name: project.name,
        created_at: project.createdAt.toISOString(),
        updated_at: project.updatedAt.toISOString(),
        total_renders: Array.isArray(scriptCut?.shots)
          ? scriptCut.shots.filter((shot) => {
              if (!shot || typeof shot !== "object") return false;
              const record = shot as Record<string, unknown>;
              return !!record.url || !!record.asset_id;
            }).length
          : typeof cloudSummary.total_renders === "number"
            ? cloudSummary.total_renders
            : (finishedRenderCounts.get(project.id) ?? 0),
        total_img2img:
          typeof cloudSummary.total_img2img === "number"
            ? cloudSummary.total_img2img
            : linkedAssets.length,
        timeline_count: Array.isArray(scriptState?.shots)
          ? scriptState.shots.length
          : projectShotCount > 0
            ? projectShotCount
            : typeof cloudSummary.timeline_count === "number"
              ? cloudSummary.timeline_count
              : 0,
        preview_url:
          scriptSnapshot?.previewUrl ??
          (previewAsset
            ? thumbnailUrl(previewAsset.assetId)
            : typeof cloudSummary.preview_url === "string"
              ? cloudSummary.preview_url
              : null),
        origin: projectSettings.origin === "cloud" ? "cloud" : "local",
        type:
          projectSettings.type === "script_to_shots"
            ? "script_to_shots"
            : "timeline"
      };
    });
  }

  async listAll(): Promise<LocalProject[]> {
    if (!this.manager.isOpen()) return [];
    // Full-project callers do not use homepage summaries. Avoid loading and
    // parsing every script's state/cut merely to obtain these IDs.
    const items = await this.manager
      .get()
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.active, true))
      .orderBy(desc(projects.updatedAt));
    const results = await Promise.allSettled(
      items.map((item) => this.get(item.id))
    );
    return results.flatMap((item) =>
      item.status === "fulfilled" && item.value ? [item.value] : []
    );
  }

  async create(input: {
    name: string;
    description: string;
    settings: Record<string, unknown>;
  }): Promise<LocalProject> {
    const projectId = randomUUID();
    const shotId = randomUUID();
    const now = new Date();
    await this.manager.transaction(async (database) => {
      await database.insert(projects).values({
        id: projectId,
        name: input.name,
        description: input.description,
        settingsJson: JSON.stringify({ ...input.settings, origin: "local" }),
        createdAt: now,
        updatedAt: now
      });
      if (input.settings.type !== "script_to_shots") {
        await database.insert(shots).values({
          id: shotId,
          projectId,
          name: "Untitled",
          position: 0,
          createdAt: now,
          updatedAt: now
        });
      }
    });
    const project = await this.get(projectId);
    if (!project) throw new Error("Failed to create the local project");
    return project;
  }

  async update(input: {
    projectId: string;
    name: string;
    description: string;
    settings: Record<string, unknown>;
  }): Promise<LocalProject> {
    const styleError = visualStyleError(input.settings.visual_style);
    if (styleError) throw new Error(styleError);
    const database = this.manager.get();
    const [existingProject] = await database
      .select({ settingsJson: projects.settingsJson })
      .from(projects)
      .where(eq(projects.id, input.projectId))
      .limit(1);
    const existingSettings = this.readProjectData(
      existingProject?.settingsJson ?? "{}",
      input.projectId,
      "settings"
    );
    await database
      .update(projects)
      .set({
        name: input.name,
        description: input.description,
        settingsJson: JSON.stringify(
          mergeBackendOwnedProjectSettings({
            storedSettings: existingSettings,
            incomingSettings: input.settings
          })
        ),
        updatedAt: new Date()
      })
      .where(and(eq(projects.id, input.projectId), eq(projects.active, true)));
    const project = await this.get(input.projectId);
    if (!project) throw new Error("Local project not found");
    return project;
  }

  /**
   * Write one project setting only while the project has no value for it, so
   * a one-time seed never overwrites what the user set, including a clear.
   * Returns whether it wrote.
   */
  async setSettingIfAbsent(
    projectId: string,
    key: string,
    value: unknown
  ): Promise<boolean> {
    const database = this.manager.get();
    const [existingProject] = await database
      .select({ settingsJson: projects.settingsJson })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    if (!existingProject) return false;
    const existingSettings = this.readProjectData(
      existingProject.settingsJson,
      projectId,
      "settings"
    );
    if (key in existingSettings) return false;
    const updated = await database
      .update(projects)
      .set({
        settingsJson: JSON.stringify({ ...existingSettings, [key]: value })
      })
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.settingsJson, existingProject.settingsJson)
        )
      )
      .returning({ id: projects.id });
    if (updated.length > 0) return true;
    return this.setSettingIfAbsent(projectId, key, value);
  }

  /**
   * Apply the same first-cast naming rule as the backend without racing a user
   * rename that may happen while the casting model is still running.
   */
  async renameUntitledFromCasting(
    projectId: string,
    castingTitle: string
  ): Promise<void> {
    if (!castingTitle) return;
    const database = this.manager.get();
    const [project] = await database
      .select({ name: projects.name })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.active, true)))
      .limit(1);
    if (!project) throw new Error("Local project not found");

    const currentName = project.name.toLowerCase();
    if (currentName !== "untitled" && !currentName.startsWith("untitled_")) {
      return;
    }

    const title = Array.from(castingTitle)
      .slice(0, PROJECT_NAME_MAX_LENGTH)
      .join("");
    await database
      .update(projects)
      .set({ name: title, updatedAt: new Date() })
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.active, true),
          eq(projects.name, project.name)
        )
      );
  }

  async delete(projectId: string): Promise<void> {
    const database = this.manager.get();
    await database
      .update(projects)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(projects.id, projectId));
  }

  async getAsset(assetId: string): Promise<LocalAsset | null> {
    if (!this.manager.isOpen()) return null;
    const database = this.manager.get();
    const [asset] = await database
      .select()
      .from(assets)
      .where(and(eq(assets.id, assetId), eq(assets.active, true)))
      .limit(1);
    if (!asset) return null;
    const links = await database
      .select({ projectId: projectAssets.projectId })
      .from(projectAssets)
      .where(eq(projectAssets.assetId, assetId));
    return this.serializeAsset(
      asset,
      links.map((link) => link.projectId)
    );
  }

  async importImage(input: LocalImageImport): Promise<LocalAsset> {
    const sourceStats = await stat(input.sourcePath);
    if (!sourceStats.isFile()) throw new Error("Image source is not a file");
    const libraryRoot = await this.getLibraryRoot();
    if (!libraryRoot) throw new Error("Choose a Mago library folder first");
    const assetId = randomUUID();
    const thumbnail = this.decodeThumbnail(input.thumbnailDataUrl);
    const thumbnailRelativePath = path.join(
      "thumbnails",
      "assets",
      `${assetId}.${thumbnail.extension}`
    );
    await atomicWriteFile(
      path.join(libraryRoot, thumbnailRelativePath),
      thumbnail.bytes
    );
    const now = new Date();
    try {
      await this.manager.transaction(async (database) => {
        await database.insert(assets).values({
          id: assetId,
          name: input.name,
          type: "image",
          origin: "uploaded",
          sourcePath: path.resolve(input.sourcePath),
          sizeBytes: sourceStats.size,
          modifiedAtImport: sourceStats.mtime,
          width: input.width,
          height: input.height,
          thumbnailRelativePath,
          dataJson: JSON.stringify({
            status: "ingested",
            origin: "uploaded"
          }),
          createdAt: now,
          updatedAt: now
        });
        await database
          .insert(projectAssets)
          .values({ projectId: input.projectId, assetId, createdAt: now });
      });
    } catch (error) {
      await rm(path.join(libraryRoot, thumbnailRelativePath), { force: true });
      throw error;
    }
    const asset = await this.getAsset(assetId);
    if (!asset) throw new Error("Failed to import image");
    return asset;
  }

  async createTrack(
    input: LocalTrackCreateInput
  ): Promise<Record<string, unknown>> {
    const database = this.manager.get();
    const [shot] = await database
      .select()
      .from(shots)
      .where(and(eq(shots.id, input.shotId), eq(shots.active, true)))
      .limit(1);
    if (!shot) throw new Error("Local shot not found");
    const trackId = randomUUID();
    const positionUnderParentTrack = input.parentTrackOrder + 1;
    const now = new Date();
    await this.manager.transaction(async (transaction) => {
      await transaction
        .update(tracks)
        .set({ position: sql`${tracks.position} + 1` })
        .where(
          and(
            eq(tracks.shotId, input.shotId),
            eq(tracks.active, true),
            gte(tracks.position, positionUnderParentTrack)
          )
        );
      await transaction.insert(tracks).values({
        id: trackId,
        shotId: input.shotId,
        projectId: shot.projectId,
        name: input.name,
        type: input.type,
        position: positionUnderParentTrack,
        dataJson: JSON.stringify(input.data),
        createdAt: now,
        updatedAt: now
      });
      await transaction
        .update(shots)
        .set({ updatedAt: now })
        .where(eq(shots.id, input.shotId));
      await transaction
        .update(projects)
        .set({ updatedAt: now })
        .where(eq(projects.id, shot.projectId));
    });
    const layer = await this.findLayer({
      projectId: shot.projectId,
      shotId: input.shotId,
      trackId
    });
    if (!layer) throw new Error("Failed to create local track");
    return layer;
  }

  async updateTrack(
    input: LocalTrackUpdateInput
  ): Promise<Record<string, unknown>> {
    const database = this.manager.get();
    const [track] = await database
      .select()
      .from(tracks)
      .where(and(eq(tracks.id, input.trackId), eq(tracks.active, true)))
      .limit(1);
    if (!track) throw new Error("Local track not found");
    const now = new Date();
    await this.manager.transaction(async (transaction) => {
      await transaction
        .update(tracks)
        .set({
          name: input.name,
          dataJson: JSON.stringify(input.data),
          ...(input.rating === undefined ? {} : { rating: input.rating }),
          updatedAt: now
        })
        .where(eq(tracks.id, input.trackId));
      await transaction
        .update(shots)
        .set({ updatedAt: now })
        .where(eq(shots.id, track.shotId));
      await transaction
        .update(projects)
        .set({ updatedAt: now })
        .where(eq(projects.id, track.projectId));
    });
    const layer = await this.findLayer({
      projectId: track.projectId,
      shotId: track.shotId,
      trackId: input.trackId
    });
    if (!layer) throw new Error("Failed to update the local track");
    return layer;
  }

  /**
   * Soft delete: source videos are linked, never owned, so the asset rows and the
   * files they point at are deliberately left untouched.
   */
  async deleteTrack(trackId: string): Promise<void> {
    const database = this.manager.get();
    const [track] = await database
      .select()
      .from(tracks)
      .where(eq(tracks.id, trackId))
      .limit(1);
    if (!track) return;
    const now = new Date();
    await this.manager.transaction(async (transaction) => {
      await transaction
        .update(tracks)
        .set({ active: false, updatedAt: now })
        .where(eq(tracks.id, trackId));
      await transaction
        .update(shots)
        .set({ updatedAt: now })
        .where(eq(shots.id, track.shotId));
      await transaction
        .update(projects)
        .set({ updatedAt: now })
        .where(eq(projects.id, track.projectId));
    });
  }

  async createShot(
    input: LocalShotCreateInput
  ): Promise<Record<string, unknown>> {
    const database = this.manager.get();
    const [project] = await database
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, input.projectId), eq(projects.active, true)))
      .limit(1);
    if (!project) throw new Error("Local project not found");
    const existingShots = await database
      .select({ position: shots.position })
      .from(shots)
      .where(eq(shots.projectId, input.projectId));
    const nextPosition =
      existingShots.reduce(
        (highest, shot) => Math.max(highest, shot.position),
        -1
      ) + 1;
    const shotId = randomUUID();
    const now = new Date();
    await this.manager.transaction(async (transaction) => {
      await transaction.insert(shots).values({
        id: shotId,
        projectId: input.projectId,
        name: input.name,
        position: nextPosition,
        createdAt: now,
        updatedAt: now
      });
      await transaction
        .update(projects)
        .set({ updatedAt: now })
        .where(eq(projects.id, input.projectId));
    });
    const created = await this.get(input.projectId);
    const timeline = (
      created?.timelines as Array<Record<string, unknown>> | undefined
    )?.find((item) => item.id === shotId);
    if (!timeline) throw new Error("Failed to create the local shot");
    return timeline;
  }

  async updateShot(
    input: LocalShotUpdateInput
  ): Promise<Record<string, unknown>> {
    const database = this.manager.get();
    const [shot] = await database
      .select()
      .from(shots)
      .where(and(eq(shots.id, input.shotId), eq(shots.active, true)))
      .limit(1);
    if (!shot) throw new Error("Local shot not found");
    const now = new Date();
    await this.manager.transaction(async (transaction) => {
      await transaction
        .update(shots)
        .set({
          name: input.name,
          settingsJson: JSON.stringify(input.settings),
          updatedAt: now
        })
        .where(eq(shots.id, input.shotId));
      await transaction
        .update(projects)
        .set({ updatedAt: now })
        .where(eq(projects.id, shot.projectId));
    });
    const project = await this.get(shot.projectId);
    const timeline = (
      project?.timelines as Array<Record<string, unknown>> | undefined
    )?.find((item) => item.id === input.shotId);
    if (!timeline) throw new Error("Failed to update the local shot");
    return timeline;
  }

  /**
   * Soft delete, like deleteTrack: the shot and its tracks stop being listed while
   * the linked source videos stay exactly where the user put them.
   */
  async deleteShot(shotId: string): Promise<void> {
    const database = this.manager.get();
    const [shot] = await database
      .select()
      .from(shots)
      .where(eq(shots.id, shotId))
      .limit(1);
    if (!shot) return;
    const now = new Date();
    await this.manager.transaction(async (transaction) => {
      await transaction
        .update(shots)
        .set({ active: false, updatedAt: now })
        .where(eq(shots.id, shotId));
      await transaction
        .update(tracks)
        .set({ active: false, updatedAt: now })
        .where(eq(tracks.shotId, shotId));
      await transaction
        .update(projects)
        .set({ updatedAt: now })
        .where(eq(projects.id, shot.projectId));
    });
  }

  async updateAsset(input: LocalAssetUpdateInput): Promise<LocalAsset | null> {
    const database = this.manager.get();
    await database
      .update(assets)
      .set({ rate: input.rate, updatedAt: new Date() })
      .where(and(eq(assets.id, input.assetId), eq(assets.active, true)));
    return this.getAsset(input.assetId);
  }

  /**
   * Persist a generated caption onto `data.prompt`, the same key cloud ingestion
   * writes server-side and the whole prompt-readback /
   * AutoPrompt chain reads.
   */
  async setAssetPrompt(
    assetId: string,
    prompt: Record<string, unknown>
  ): Promise<LocalAsset | null> {
    return this.mergeAssetData(assetId, (data) => ({ ...data, prompt }));
  }

  /**
   * Fill `data.description` only while the key is absent — the backend's
   * rule. Presence, not truthiness: a description the
   * user cleared to blank is their choice, and an auto-caption that finishes
   * afterwards must not bring the old text back.
   */
  async setAssetDescriptionIfAbsent(
    assetId: string,
    description: string
  ): Promise<LocalAsset | null> {
    return this.mergeAssetData(assetId, (data) =>
      "description" in data ? data : { ...data, description }
    );
  }

  /**
   * Upsert an AutoPrompt result into `data.auto_prompt`, keyed on
   * (video_asset_id, version) — mirrors the backend
   * so `findExistingAutoPrompt` on the frontend keeps working unchanged.
   */
  async appendAssetAutoPrompt(
    assetId: string,
    item: { video_asset_id: string; version: string; positive_prompt: string }
  ): Promise<LocalAsset | null> {
    return this.mergeAssetData(assetId, (data) => {
      const existing = Array.isArray(data.auto_prompt)
        ? (data.auto_prompt as Array<Record<string, unknown>>)
        : [];
      const matches = (entry: Record<string, unknown>): boolean =>
        entry.video_asset_id === item.video_asset_id &&
        entry.version === item.version;
      const autoPrompt = existing.some(matches)
        ? existing.map((entry) =>
            matches(entry) ? { ...entry, ...item } : entry
          )
        : [...existing, item];
      return { ...data, auto_prompt: autoPrompt };
    });
  }

  /**
   * Read-merge-write `data_json` so unrelated keys survive.
   *
   * Serialised against every other merge: a caption (`prompt`) and an
   * AutoPrompt save (`auto_prompt`) can land on the same style-reference asset
   * at once, and two interleaved read-merge-writes would drop whichever key was
   * written first. A mutex rather than a transaction, because DatabaseManager
   * shares one connection and `BEGIN IMMEDIATE` would throw if a long
   * `importVideos` transaction were already open.
   */
  private async mergeAssetData(
    assetId: string,
    merge: (data: Record<string, unknown>) => Record<string, unknown>
  ): Promise<LocalAsset | null> {
    const run = this.assetDataMerges.then(async () => {
      if (!this.manager.isOpen()) return null;
      const database = this.manager.get();
      const [asset] = await database
        .select()
        .from(assets)
        .where(and(eq(assets.id, assetId), eq(assets.active, true)))
        .limit(1);
      if (!asset) return null;
      const data = storedObject(asset.dataJson, {
        id: `asset-data:${asset.id}`,
        kind: "asset",
        assetId: asset.id,
        message: `Could not read saved data for asset ${asset.name}. The original data has been kept.`
      });
      await database
        .update(assets)
        .set({ dataJson: JSON.stringify(merge(data)), updatedAt: new Date() })
        .where(eq(assets.id, assetId));
      return this.getAsset(assetId);
    });
    // Keep the chain alive after a failed merge.
    this.assetDataMerges = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  async get(projectId: string): Promise<LocalProject | null> {
    if (!this.manager.isOpen()) return null;
    const database = this.manager.get();
    const [project] = await database
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.active, true)))
      .limit(1);
    if (!project) return null;

    const projectSettings = this.readProjectData(
      project.settingsJson,
      project.id,
      "settings"
    );
    if (
      projectSettings.origin !== "cloud" &&
      projectSettings.type === "script_to_shots" &&
      !("visual_style" in projectSettings)
    ) {
      const [snapshot] = await database
        .select({ stateJson: scriptProjectSnapshots.stateJson })
        .from(scriptProjectSnapshots)
        .where(eq(scriptProjectSnapshots.projectId, projectId))
        .limit(1);
      const legacyState = parseJson<unknown>(
        snapshot?.stateJson ?? "null",
        null
      );
      if (
        legacyState &&
        typeof legacyState === "object" &&
        !Array.isArray(legacyState) &&
        "visual_style" in legacyState &&
        visualStyleError(legacyState.visual_style) === null
      ) {
        await this.setSettingIfAbsent(
          projectId,
          "visual_style",
          legacyState.visual_style ?? null
        );
        return this.get(projectId);
      }
    }

    const shotRows = await database
      .select()
      .from(shots)
      .where(and(eq(shots.projectId, projectId), eq(shots.active, true)))
      .orderBy(asc(shots.position));
    const trackRows = await database
      .select()
      .from(tracks)
      .where(and(eq(tracks.projectId, projectId), eq(tracks.active, true)))
      .orderBy(asc(tracks.position));
    const trackIds = trackRows.map((track) => track.id);
    const clipRows = trackIds.length
      ? await database
          .select()
          .from(clips)
          .where(inArray(clips.trackId, trackIds))
      : [];
    const assetIds = [...new Set(clipRows.map((clip) => clip.assetId))];
    const assetRows = assetIds.length
      ? await database.select().from(assets).where(inArray(assets.id, assetIds))
      : [];
    const assetById = new Map(assetRows.map((asset) => [asset.id, asset]));
    const clipsByTrackId = new Map<string, typeof clipRows>();
    for (const clip of clipRows) {
      const existing = clipsByTrackId.get(clip.trackId) ?? [];
      existing.push(clip);
      clipsByTrackId.set(clip.trackId, existing);
    }

    const isCloudOriginProject = projectSettings.origin === "cloud";
    const { cloudMirroredTrackIds } = isCloudOriginProject
      ? await readCloudMirroredTracks(database, trackIds)
      : { cloudMirroredTrackIds: new Set<string>() };
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      active: project.active,
      type:
        projectSettings.type === "script_to_shots"
          ? "script_to_shots"
          : "timeline",
      origin: projectSettings.origin === "cloud" ? "cloud" : "local",
      settings: projectSettings,
      timelines: shotRows.map((shot) => ({
        id: shot.id,
        name: shot.name,
        project_id: project.id,
        user_id: OFFLINE_LOCAL_USER_ID,
        settings: this.readProjectData(
          shot.settingsJson,
          project.id,
          `shot ${shot.id}`
        ),
        layers: trackRows
          .filter((track) => track.shotId === shot.id)
          .map((track) => ({
            id: track.id,
            name: track.name,
            timeline_id: shot.id,
            project_id: project.id,
            status: null,
            user_id: OFFLINE_LOCAL_USER_ID,
            type: track.type,
            active: track.active,
            muted: track.muted,
            visible: track.visible,
            layer_order: track.position,
            rating: track.rating,
            cloud_mirrored: cloudMirroredTrackIds.has(track.id),
            created_at: track.createdAt.toISOString(),
            data: this.readProjectData(
              track.dataJson,
              project.id,
              `track ${track.id}`
            ),
            clips: (clipsByTrackId.get(track.id) ?? []).flatMap((clip) => {
              const asset = assetById.get(clip.assetId);
              if (!asset) return [];
              const durationSeconds = (asset.duration ?? 0) / 1000;
              const fps = (asset.fps ?? 0) / 1000;
              const durationFrames =
                asset.frameCount ?? Math.round(durationSeconds * fps);
              const clipData = this.readProjectData(
                clip.dataJson,
                project.id,
                `clip ${clip.id}`
              );
              const timelineFrames = clipTimelineFrames({
                clipData,
                assetFrameCount: durationFrames,
                assetFps: fps,
                timelineOffsetMs: clip.timelineOffset
              });
              return [
                {
                  id: clip.id,
                  layer_id: track.id,
                  name: clip.name,
                  asset_id: asset.id,
                  data: {
                    ...clipData,
                    duration: timelineFrames.duration,
                    timeline_offset: timelineFrames.timelineOffset
                  },
                  asset: {
                    id: asset.id,
                    name: asset.name,
                    filepath: mediaUrl(asset.id),
                    project_ids: [project.id],
                    type: asset.type === "image" ? "IMAGE" : "VIDEO",
                    created_at: asset.createdAt.toISOString(),
                    updated_at: asset.updatedAt.toISOString(),
                    origin: asset.origin,
                    last_used: asset.updatedAt.toISOString(),
                    rate: asset.rate,
                    data: {
                      ...parseAssetData(asset.dataJson, asset.id),
                      status:
                        asset.status === "available" ? "ingested" : "created",
                      queue_status: assetQueueStatus(asset),
                      duration: timelineFrames.duration,
                      duration_seconds: durationSeconds,
                      fps,
                      total_frames: asset.frameCount ?? 0,
                      size: [asset.width ?? 0, asset.height ?? 0],
                      width: asset.width ?? 0,
                      height: asset.height ?? 0,
                      thumbnail_filepath: thumbnailUrl(asset.id),
                      thumbnails: [
                        {
                          width: asset.width ?? 0,
                          height: asset.height ?? 0,
                          key: thumbnailUrl(asset.id),
                          first_frame: true
                        }
                      ]
                    },
                    manifest: { controlNets: [] }
                  }
                }
              ];
            })
          }))
      }))
    };
  }

  async listShots(projectId: string): Promise<LocalProjectListItem[]> {
    const project = await this.get(projectId);
    if (!project) return [];
    const database = this.manager.get();
    const [shotRows, renderClipRows] = await Promise.all([
      database
        .select({
          id: shots.id,
          createdAt: shots.createdAt,
          updatedAt: shots.updatedAt
        })
        .from(shots)
        .where(and(eq(shots.projectId, projectId), eq(shots.active, true))),
      this.readActiveRenderClips(database, eq(tracks.projectId, projectId))
    ]);
    const shotTimestampsById = new Map(shotRows.map((shot) => [shot.id, shot]));
    const finishedRenderCountsByShotId = new Map<string, number>();
    for (const renderClip of renderClipRows) {
      if (!isFinishedRenderClip(renderClip)) continue;
      finishedRenderCountsByShotId.set(
        renderClip.shotId,
        (finishedRenderCountsByShotId.get(renderClip.shotId) ?? 0) + 1
      );
    }
    const timelines = (project.timelines ?? []) as Array<
      Record<string, unknown>
    >;
    return timelines.map((timeline) => {
      const shotId = String(timeline.id);
      const shotTimestamps = shotTimestampsById.get(shotId);
      const layers = (timeline.layers ?? []) as Array<Record<string, unknown>>;
      const firstLayer = layers[0];
      const firstClip = (
        (firstLayer?.clips ?? []) as Array<Record<string, unknown>>
      )[0];
      const asset = firstClip?.asset as Record<string, unknown> | undefined;
      const data = asset?.data as Record<string, unknown> | undefined;
      return {
        id: shotId,
        name: String(timeline.name),
        created_at: (shotTimestamps?.createdAt ?? new Date(0)).toISOString(),
        updated_at: (shotTimestamps?.updatedAt ?? new Date(0)).toISOString(),
        total_renders: finishedRenderCountsByShotId.get(shotId) ?? 0,
        total_img2img: layers.length,
        timeline_count: 1,
        preview_url: (data?.thumbnail_filepath as string | undefined) ?? null
      };
    });
  }

  async importVideos(
    projectId: string,
    videos: LocalVideoImport[]
  ): Promise<LocalVideoImportResult[]> {
    const libraryRoot = await this.getLibraryRoot();
    if (!libraryRoot) throw new Error("Choose a Mago library folder first");
    const thumbnailRoot = path.join(libraryRoot, "thumbnails", "assets");
    await mkdir(thumbnailRoot, { recursive: true });

    const prepared: Array<{
      video: LocalVideoImport;
      sourceStats: Stats;
      assetId: string;
      thumbnailRelativePath: string;
    }> = [];
    try {
      for (const video of videos) {
        const sourceStats = await stat(video.sourcePath);
        if (!sourceStats.isFile())
          throw new Error("Video source is not a file");
        const assetId = randomUUID();
        const thumbnail = this.decodeThumbnail(video.thumbnailDataUrl);
        const thumbnailRelativePath = path.join(
          "thumbnails",
          "assets",
          `${assetId}.${thumbnail.extension}`
        );
        await atomicWriteFile(
          path.join(libraryRoot, thumbnailRelativePath),
          thumbnail.bytes
        );
        prepared.push({
          video,
          sourceStats,
          assetId,
          thumbnailRelativePath
        });
      }
    } catch (error) {
      await this.removePreparedThumbnails(libraryRoot, prepared);
      throw error;
    }

    try {
      return await this.manager.transaction(async (database) => {
        const [project] = await database
          .select()
          .from(projects)
          .where(and(eq(projects.id, projectId), eq(projects.active, true)))
          .limit(1);
        if (!project) throw new Error("Local project not found");
        const existingShots = await database
          .select()
          .from(shots)
          .where(and(eq(shots.projectId, projectId), eq(shots.active, true)))
          .orderBy(asc(shots.position));
        const existingTracks = await database
          .select({ shotId: tracks.shotId })
          .from(tracks)
          .where(and(eq(tracks.projectId, projectId), eq(tracks.active, true)));
        const occupiedShotIds = new Set(
          existingTracks.map((track) => track.shotId)
        );
        const emptyShot = existingShots.find(
          (shot) => !occupiedShotIds.has(shot.id)
        );
        const results: LocalVideoImportResult[] = [];

        for (let index = 0; index < prepared.length; index++) {
          const item = prepared[index]!;
          const now = new Date();
          const shotId = index === 0 && emptyShot ? emptyShot.id : randomUUID();
          const trackId = randomUUID();
          const clipId = randomUUID();
          const baseName = path.basename(
            item.video.name,
            path.extname(item.video.name)
          );
          if (index === 0 && emptyShot) {
            await database
              .update(shots)
              .set({ name: baseName, updatedAt: now })
              .where(eq(shots.id, shotId));
          } else {
            await database.insert(shots).values({
              id: shotId,
              projectId,
              name: baseName,
              position: existingShots.length + index,
              createdAt: now,
              updatedAt: now
            });
          }
          await database.insert(assets).values({
            id: item.assetId,
            name: item.video.name,
            type: "video",
            origin: "uploaded",
            sourcePath: path.resolve(item.video.sourcePath),
            sizeBytes: item.sourceStats.size,
            modifiedAtImport: item.sourceStats.mtime,
            duration: Math.round(item.video.durationSeconds * 1000),
            fps: Math.round(item.video.fps * 1000),
            frameCount: item.video.frameCount,
            width: item.video.width,
            height: item.video.height,
            thumbnailRelativePath: item.thumbnailRelativePath,
            dataJson: JSON.stringify({ status: "ingested" }),
            createdAt: now,
            updatedAt: now
          });
          await database.insert(tracks).values({
            id: trackId,
            shotId,
            projectId,
            name: baseName,
            type: "IMAGE",
            position: 0,
            createdAt: now,
            updatedAt: now
          });
          await database.insert(clips).values({
            id: clipId,
            trackId,
            assetId: item.assetId,
            name: baseName,
            trimStart:
              item.video.trimStartSeconds === undefined
                ? null
                : Math.round(item.video.trimStartSeconds * 1000),
            trimEnd:
              item.video.trimEndSeconds === undefined
                ? null
                : Math.round(item.video.trimEndSeconds * 1000),
            createdAt: now,
            updatedAt: now
          });
          await database.insert(projectAssets).values({
            projectId,
            assetId: item.assetId,
            createdAt: now
          });
          results.push({ assetId: item.assetId, shotId });
        }
        await database
          .update(projects)
          .set({ updatedAt: new Date() })
          .where(eq(projects.id, projectId));
        return results;
      });
    } catch (error) {
      await this.removePreparedThumbnails(libraryRoot, prepared);
      throw error;
    }
  }

  async projectStats(projectId: string): Promise<ProjectStats> {
    if (!this.manager.isOpen()) return buildProjectStats([]);
    const jobs = await this.manager
      .get()
      .select({
        id: imageRenderJobs.id,
        model: imageRenderJobs.model,
        status: imageRenderJobs.status,
        requestJson: imageRenderJobs.requestJson,
        createdAt: imageRenderJobs.createdAt,
        startedAt: imageRenderJobs.startedAt,
        finishedAt: imageRenderJobs.finishedAt
      })
      .from(imageRenderJobs)
      .where(eq(imageRenderJobs.projectId, projectId))
      .orderBy(desc(imageRenderJobs.createdAt));
    return buildProjectStats(jobs);
  }

  async assetSourcePath(assetId: string): Promise<string | null> {
    if (!this.manager.isOpen()) return null;
    const [asset] = await this.manager
      .get()
      .select()
      .from(assets)
      .where(and(eq(assets.id, assetId), eq(assets.active, true)))
      .limit(1);
    return asset && asset.status === "available" ? asset.sourcePath : null;
  }

  async resolveMediaPath(
    kind: "asset" | "thumbnail",
    id: string
  ): Promise<string | null> {
    if (!this.manager.isOpen()) return null;
    const [asset] = await this.manager
      .get()
      .select()
      .from(assets)
      .where(and(eq(assets.id, id), eq(assets.active, true)))
      .limit(1);
    if (!asset) return null;
    if (kind === "asset") return asset.sourcePath;
    const libraryRoot = await this.getLibraryRoot();
    if (libraryRoot && asset.thumbnailRelativePath) {
      return path.join(libraryRoot, asset.thumbnailRelativePath);
    }
    return asset.status === "available" ? asset.sourcePath : null;
  }

  private readProjectData(
    value: string,
    projectId: string,
    section: string,
    fallback = false
  ): Record<string, unknown> {
    return storedObject(
      value,
      {
        id: `project:${projectId}:${section}`,
        kind: "project",
        projectId,
        message: `Could not read ${section} for project ${projectId}. Original data has been kept; recover a database backup to restore it.`
      },
      fallback
    );
  }

  private readActiveRenderClips(
    database: ReturnType<DatabaseManager["get"]>,
    trackScope: SQL | undefined
  ) {
    return database
      .select({
        projectId: tracks.projectId,
        shotId: tracks.shotId,
        trackType: tracks.type,
        assetId: assets.id,
        assetStatus: assets.status,
        pendingAssetDataJson: sql<
          string | null
        >`CASE WHEN ${assets.status} = 'pending' THEN ${assets.dataJson} END`
      })
      .from(tracks)
      .innerJoin(shots, eq(tracks.shotId, shots.id))
      .innerJoin(clips, eq(clips.trackId, tracks.id))
      .innerJoin(assets, eq(clips.assetId, assets.id))
      .where(
        and(
          trackScope,
          eq(tracks.active, true),
          eq(shots.active, true),
          sql`upper(${tracks.type}) = ${RENDER_TRACK_TYPE}`
        )
      );
  }

  private async findLayer({
    projectId,
    shotId,
    trackId
  }: {
    projectId: string;
    shotId: string;
    trackId: string;
  }): Promise<Record<string, unknown> | undefined> {
    const project = await this.get(projectId);
    const timeline = (
      project?.timelines as Array<Record<string, unknown>> | undefined
    )?.find((item) => item.id === shotId);
    return (
      timeline?.layers as Array<Record<string, unknown>> | undefined
    )?.find((item) => item.id === trackId);
  }

  private serializeAsset(
    asset: typeof assets.$inferSelect,
    projectIds: string[]
  ): LocalAsset {
    const durationSeconds = (asset.duration ?? 0) / 1000;
    const fps = (asset.fps ?? 0) / 1000;
    const durationFrames =
      asset.frameCount ?? Math.round(durationSeconds * fps);
    return {
      id: asset.id,
      name: asset.name,
      filepath: mediaUrl(asset.id),
      project_ids: projectIds,
      type: asset.type === "image" ? "IMAGE" : "VIDEO",
      created_at: asset.createdAt.toISOString(),
      updated_at: asset.updatedAt.toISOString(),
      origin: asset.origin,
      last_used: asset.updatedAt.toISOString(),
      rate: asset.rate,
      data: {
        ...parseAssetData(asset.dataJson, asset.id),
        origin: asset.origin,
        status: asset.status === "available" ? "ingested" : "created",
        queue_status: assetQueueStatus(asset),
        duration: durationFrames,
        duration_seconds: durationSeconds,
        fps,
        total_frames: asset.frameCount ?? durationFrames,
        size: [asset.width ?? 0, asset.height ?? 0],
        width: asset.width ?? 0,
        height: asset.height ?? 0,
        thumbnail_filepath: thumbnailUrl(asset.id),
        thumbnails: [
          {
            width: asset.width ?? 0,
            height: asset.height ?? 0,
            key: thumbnailUrl(asset.id),
            first_frame: true
          }
        ]
      },
      manifest: { controlNets: [] }
    };
  }

  private decodeThumbnail(dataUrl: string): {
    bytes: Buffer;
    extension: "jpg" | "png" | "webp";
  } {
    const match =
      /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(
        dataUrl
      );
    if (!match) throw new Error("Invalid thumbnail data");
    return {
      bytes: Buffer.from(match[2], "base64"),
      extension:
        match[1] === "png" ? "png" : match[1] === "webp" ? "webp" : "jpg"
    };
  }

  private async removePreparedThumbnails(
    libraryRoot: string,
    prepared: Array<{ thumbnailRelativePath: string }>
  ): Promise<void> {
    await Promise.all(
      prepared.map((item) =>
        rm(path.join(libraryRoot, item.thumbnailRelativePath), { force: true })
      )
    );
  }
}
