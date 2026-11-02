import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import { and, eq, inArray, notInArray } from "drizzle-orm";
import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";

import { resolveCloudConfig } from "../../shared/cloudConfig";
import {
  collectCloudReferenceAssetIdMappings,
  collectCloudReferenceAssetIds
} from "../../shared/collectCloudReferenceAssetIds";
import type { LocalCloudProjectMirrorInput } from "../../shared/contracts";
import {
  openCloudStorageDownload,
  type CloudStorageAccess
} from "../cloudStorage/openCloudStorageDownload";
import { parseAllowedCloudStorageUrl } from "../cloudStorage/parseAllowedCloudStorageUrl";
import { publishFile } from "../storage/atomicFile";

import { DatabaseManager } from "./databaseManager";
import { readCloudLinkedLocalIds } from "./readCloudLinkedLocalIds";
import { readCloudMirroredTracks } from "./readCloudMirroredTracks";
import * as schema from "./schema";
import {
  assets,
  clips,
  cloudLinks,
  cloudRenderJobs,
  projectAssets,
  projects,
  shots,
  tracks
} from "./schema";

type MirrorDatabase = SqliteRemoteDatabase<typeof schema>;

const PROJECT_HASH_LENGTH = 24;
const ASSET_HASH_LENGTH = 32;

const objectValue = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const arrayValue = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.flatMap((item) => (objectValue(item) ? [item] : []))
    : [];

const stringValue = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const numberValue = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const booleanValue = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

const dateValue = (value: unknown, fallback: Date): Date => {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? fallback : parsed;
};

const parseJson = (value: string | undefined): Record<string, unknown> => {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return objectValue(parsed) ?? {};
  } catch {
    return {};
  }
};

const cloudOriginAssetLinkData = ({
  cloudLayerId,
  isImage
}: {
  cloudLayerId: string | undefined;
  isImage: boolean;
}): Record<string, unknown> => ({
  origin: "cloud",
  status: "ingested",
  ...(cloudLayerId ? { cloudLayerId } : {}),
  ...(isImage ? { kind: "image" } : {})
});

const upsertCloudOriginLink = async (
  database: MirrorDatabase,
  kind: "timeline" | "layer" | "clip",
  localId: string,
  now: Date
): Promise<void> => {
  const dataJson = JSON.stringify({ origin: "cloud" });
  await database
    .insert(cloudLinks)
    .values({
      kind,
      localId,
      cloudId: localId,
      syncedAt: now,
      dataJson,
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: [cloudLinks.kind, cloudLinks.localId],
      set: { cloudId: localId, syncedAt: now, dataJson, updatedAt: now }
    });
};

const deleteCloudLinks = async (
  database: MirrorDatabase,
  kind: "layer" | "clip",
  localIds: string[]
): Promise<void> => {
  if (localIds.length === 0) return;
  await database
    .delete(cloudLinks)
    .where(
      and(eq(cloudLinks.kind, kind), inArray(cloudLinks.localId, localIds))
    );
};

const isCloudOriginLinkData = (dataJson: string): boolean =>
  parseJson(dataJson).origin === "cloud";

const safeExtension = (url: string, fallback: string): string => {
  try {
    const candidate = path
      .extname(new URL(url).pathname)
      .slice(1)
      .toLowerCase();
    return /^(?:jpe?g|png|webp|gif|mp4|mov|webm|mkv)$/.test(candidate)
      ? candidate
      : fallback;
  } catch {
    return fallback;
  }
};

type CachedFile = { absolutePath: string; relativePath: string; size: number };

/** Imports cloud-owned timeline projects into the normal local project model.
 * Hidden backend mirrors of local projects are rejected via cloud_links, which
 * keeps the pull path from creating a second project card for local work. */
export class CloudProjectMirrorRepository {
  private readonly downloads = new Map<string, Promise<CachedFile>>();
  private readonly assetSyncs = new Map<string, AbortController>();
  private readonly assetProjects = new Map<string, string>();

  constructor(
    private readonly manager: DatabaseManager,
    private readonly getLibraryRoot: () => Promise<string>,
    private readonly cloudStorage: CloudStorageAccess = {
      allowedHosts: resolveCloudConfig().cloudStorageHosts
    }
  ) {}

  async put(input: LocalCloudProjectMirrorInput): Promise<boolean> {
    const projectId = stringValue(input.project.id);
    if (!projectId) throw new Error("Cloud project id is required");
    if (await this.isLocalProjectCloudCopy(projectId)) return false;

    const database = this.manager.get();
    const [existing] = await database
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    const existingSettings = parseJson(existing?.settingsJson);
    if (existing && existingSettings.origin !== "cloud") return false;

    await this.putMetadata(input.project, existing);
    if (!input.includeContent) return true;

    const timelines = arrayValue(input.project.timelines);
    if (!Array.isArray(input.project.timelines)) return true;
    await this.replaceContent(projectId, timelines);
    return true;
  }

  /** Downloads one asset's files and marks it available the moment they land,
   * so the renderer can show media one asset at a time instead of waiting for
   * a whole project. The asset row already exists from the metadata pass. */
  async cacheAsset(input: {
    projectId: string;
    assetId: string;
    isImage: boolean;
    urls: { sourceUrl?: string; thumbnailUrl?: string };
  }): Promise<boolean> {
    const key = JSON.stringify([input.projectId, input.assetId]);
    const controller = new AbortController();
    this.assetSyncs.set(key, controller);
    this.assetProjects.set(key, input.projectId);
    try {
      const prepared = await this.prepareAsset(
        input.projectId,
        input.assetId,
        { type: input.isImage ? "IMAGE" : "VIDEO" },
        input.urls,
        controller.signal
      );
      controller.signal.throwIfAborted();
      await this.persistPreparedAsset(input.assetId, prepared);
      return !!prepared.source;
    } finally {
      if (this.assetSyncs.get(key) === controller) {
        this.assetSyncs.delete(key);
        this.assetProjects.delete(key);
      }
    }
  }

  cancel(projectId: string): void {
    for (const [key, owner] of this.assetProjects) {
      if (owner === projectId) this.assetSyncs.get(key)?.abort();
    }
  }

  cancelAsset(projectId: string, assetId: string): void {
    this.assetSyncs.get(JSON.stringify([projectId, assetId]))?.abort();
  }

  private async isLocalProjectCloudCopy(
    cloudProjectId: string
  ): Promise<boolean> {
    const links = await this.manager
      .get()
      .select({ localId: cloudLinks.localId })
      .from(cloudLinks)
      .where(
        and(
          eq(cloudLinks.kind, "project"),
          eq(cloudLinks.cloudId, cloudProjectId)
        )
      );
    return links.some((link) => link.localId !== cloudProjectId);
  }

  private async putMetadata(
    project: Record<string, unknown>,
    existing: typeof projects.$inferSelect | undefined
  ): Promise<void> {
    const projectId = stringValue(project.id);
    const now = new Date();
    const existingSettings = parseJson(existing?.settingsJson);
    const incomingSettings = objectValue(project.settings) ?? {};
    const existingSummary = objectValue(existingSettings.cloudSummary) ?? {};
    const cloudSummary = {
      ...existingSummary,
      ...(typeof project.total_renders === "number"
        ? { total_renders: project.total_renders }
        : {}),
      ...(typeof project.total_img2img === "number"
        ? { total_img2img: project.total_img2img }
        : {}),
      ...(typeof project.timeline_count === "number"
        ? { timeline_count: project.timeline_count }
        : {}),
      ...(typeof project.preview_url === "string" ||
      project.preview_url === null
        ? { preview_url: project.preview_url }
        : {})
    };
    const settings = {
      ...existingSettings,
      ...incomingSettings,
      type: project.type === "script_to_shots" ? "script_to_shots" : "timeline",
      origin: "cloud",
      cloudSummary
    };
    // The desktop catalog is an origin catalog, not a "last synchronized"
    // feed. Cloud GETs can touch updated_at server-side, so both persisted
    // catalog timestamps deliberately use the immutable creation date.
    const createdAt = dateValue(project.created_at, existing?.createdAt ?? now);
    const values = {
      id: projectId,
      name: stringValue(project.name, existing?.name ?? "Cloud project"),
      description:
        typeof project.description === "string"
          ? project.description
          : (existing?.description ?? ""),
      active: booleanValue(project.active, true),
      settingsJson: JSON.stringify(settings),
      createdAt,
      updatedAt: createdAt
    };
    await this.manager
      .get()
      .insert(projects)
      .values(values)
      .onConflictDoUpdate({
        target: projects.id,
        set: {
          name: values.name,
          description: values.description,
          active: values.active,
          settingsJson: values.settingsJson,
          createdAt: values.createdAt,
          updatedAt: values.updatedAt
        }
      });
    await this.manager
      .get()
      .insert(cloudLinks)
      .values({
        kind: "project",
        localId: projectId,
        cloudId: projectId,
        syncedAt: now,
        dataJson: JSON.stringify({ origin: "cloud" }),
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [cloudLinks.kind, cloudLinks.localId],
        set: {
          cloudId: projectId,
          syncedAt: now,
          dataJson: JSON.stringify({ origin: "cloud" }),
          updatedAt: now
        }
      });
  }

  private async replaceContent(
    projectId: string,
    timelines: Record<string, unknown>[]
  ): Promise<void> {
    const cloudAssets = new Map<string, Record<string, unknown>>();
    const cloudLayerIdByAssetId = new Map<string, string>();
    const cloudReferenceAssetIds = collectCloudReferenceAssetIds(timelines);
    const cloudReferenceAssetIdMappings =
      collectCloudReferenceAssetIdMappings(timelines);
    for (const timeline of timelines) {
      for (const layer of arrayValue(timeline.layers)) {
        const layerId = stringValue(layer.id);
        for (const clip of arrayValue(layer.clips)) {
          const asset = objectValue(clip.asset);
          const assetId = stringValue(asset?.id ?? clip.asset_id);
          if (!asset || !assetId) continue;
          cloudAssets.set(assetId, asset);
          if (layerId && !cloudLayerIdByAssetId.has(assetId)) {
            cloudLayerIdByAssetId.set(assetId, layerId);
          }
        }
      }
    }

    const entries = [...cloudAssets.entries()];
    const relevantAssetIds = [
      ...new Set([
        ...entries.map(([assetId]) => assetId),
        ...cloudReferenceAssetIds,
        ...cloudReferenceAssetIdMappings.keys()
      ])
    ];
    const existingAssetRows = relevantAssetIds.length
      ? await this.manager
          .get()
          .select()
          .from(assets)
          .where(inArray(assets.id, relevantAssetIds))
      : [];
    const existingAssets = new Map(
      existingAssetRows.map((asset) => [asset.id, asset])
    );
    await this.manager.transaction(async (database) => {
      await this.removeMirroredContentKeepingLocalContent(
        database,
        projectId,
        timelines
      );

      for (const [assetId, asset] of cloudAssets) {
        const existingAsset = existingAssets.get(assetId);
        const data = objectValue(asset.data) ?? {};
        const fps = numberValue(data.output_fps, numberValue(data.fps));
        const frameCount = numberValue(
          data.total_frames,
          numberValue(data.duration)
        );
        const durationSeconds = numberValue(
          data.duration_seconds,
          fps > 0 && frameCount > 0 ? frameCount / fps : 0
        );
        const size = Array.isArray(data.size)
          ? data.size
          : Array.isArray(data.output_size)
            ? data.output_size
            : [];
        const now = new Date();
        const values = {
          id: assetId,
          name: stringValue(asset.name, "Cloud asset"),
          type:
            asset.type === "IMAGE" || asset.type === "IMAGE_LIST"
              ? "image"
              : "video",
          origin: asset.origin === "uploaded" ? "uploaded" : "generated",
          sourcePath: existingAsset?.sourcePath ?? "",
          relativeSourcePath: existingAsset?.relativeSourcePath ?? null,
          sizeBytes: existingAsset?.sizeBytes ?? null,
          modifiedAtImport: now,
          duration: Math.round(durationSeconds * 1000),
          fps: Math.round(fps * 1000),
          frameCount: Math.round(frameCount),
          width: Math.round(numberValue(data.width, numberValue(size[0]))),
          height: Math.round(numberValue(data.height, numberValue(size[1]))),
          thumbnailRelativePath: existingAsset?.thumbnailRelativePath ?? null,
          status:
            existingAsset?.status === "available" ? "available" : "pending",
          active: true,
          rate: Math.round(numberValue(asset.rate)),
          dataJson: JSON.stringify({ ...data, cloudMirror: true }),
          createdAt: dateValue(asset.created_at, now),
          updatedAt: dateValue(asset.updated_at, now)
        };
        await database
          .insert(assets)
          .values(values)
          .onConflictDoUpdate({ target: assets.id, set: values });
        await database
          .insert(projectAssets)
          .values({ projectId, assetId, createdAt: now })
          .onConflictDoNothing();
        const assetLinkDataJson = JSON.stringify(
          cloudOriginAssetLinkData({
            cloudLayerId: cloudLayerIdByAssetId.get(assetId),
            isImage: values.type === "image"
          })
        );
        await database
          .insert(cloudLinks)
          .values({
            kind: "asset",
            localId: assetId,
            cloudId: assetId,
            syncedAt: now,
            dataJson: assetLinkDataJson,
            createdAt: now,
            updatedAt: now
          })
          .onConflictDoUpdate({
            target: [cloudLinks.kind, cloudLinks.localId],
            set: {
              cloudId: assetId,
              syncedAt: now,
              dataJson: assetLinkDataJson,
              updatedAt: now
            }
          });
      }

      for (const assetId of cloudReferenceAssetIds) {
        if (cloudAssets.has(assetId)) continue;
        const now = new Date();
        const dataJson = JSON.stringify(
          cloudOriginAssetLinkData({ cloudLayerId: undefined, isImage: true })
        );
        await database
          .insert(assets)
          .values({
            id: assetId,
            name: "Cloud reference image",
            type: "image",
            origin: "uploaded",
            sourcePath: "",
            status: "pending",
            active: true,
            dataJson: JSON.stringify({ cloudMirror: true }),
            createdAt: now,
            updatedAt: now
          })
          .onConflictDoNothing();
        await database
          .insert(projectAssets)
          .values({ projectId, assetId, createdAt: now })
          .onConflictDoNothing();
        await database
          .insert(cloudLinks)
          .values({
            kind: "asset",
            localId: assetId,
            cloudId: assetId,
            syncedAt: now,
            dataJson,
            createdAt: now,
            updatedAt: now
          })
          .onConflictDoUpdate({
            target: [cloudLinks.kind, cloudLinks.localId],
            set: { cloudId: assetId, syncedAt: now, dataJson, updatedAt: now }
          });
      }

      for (const [localId, cloudId] of cloudReferenceAssetIdMappings) {
        const existingAsset = existingAssets.get(localId);
        if (!existingAsset || parseJson(existingAsset.dataJson).cloudMirror) {
          continue;
        }
        const now = new Date();
        const dataJson = JSON.stringify({ status: "ingested", kind: "image" });
        await database
          .insert(cloudLinks)
          .values({
            kind: "asset",
            localId,
            cloudId,
            syncedAt: now,
            dataJson,
            createdAt: now,
            updatedAt: now
          })
          .onConflictDoUpdate({
            target: [cloudLinks.kind, cloudLinks.localId],
            set: { cloudId, syncedAt: now, dataJson, updatedAt: now }
          });
      }

      for (const [shotPosition, timeline] of timelines.entries()) {
        const shotId = stringValue(timeline.id);
        if (!shotId) continue;
        const now = new Date();
        const shotValues = {
          id: shotId,
          projectId,
          name: stringValue(timeline.name, "Shot"),
          position: shotPosition,
          active: booleanValue(timeline.active, true),
          settingsJson: JSON.stringify(objectValue(timeline.settings) ?? {}),
          createdAt: dateValue(timeline.created_at, now),
          updatedAt: dateValue(timeline.updated_at, now)
        };
        await database
          .insert(shots)
          .values(shotValues)
          .onConflictDoUpdate({ target: shots.id, set: shotValues });
        await upsertCloudOriginLink(database, "timeline", shotId, now);
        for (const [layerPosition, layer] of arrayValue(
          timeline.layers
        ).entries()) {
          const trackId = stringValue(layer.id);
          if (!trackId) continue;
          const trackValues = {
            id: trackId,
            shotId,
            projectId,
            name: stringValue(layer.name, "Track"),
            type: stringValue(layer.type, "IMAGE"),
            visible: booleanValue(layer.visible, true),
            muted: booleanValue(layer.muted, false),
            active: booleanValue(layer.active, true),
            position: Math.round(numberValue(layer.layer_order, layerPosition)),
            rating: Math.round(numberValue(layer.rating)),
            dataJson: JSON.stringify(objectValue(layer.data) ?? {}),
            createdAt: dateValue(layer.created_at, now),
            updatedAt: dateValue(layer.updated_at, now)
          };
          await database
            .insert(tracks)
            .values(trackValues)
            .onConflictDoUpdate({ target: tracks.id, set: trackValues });
          await upsertCloudOriginLink(database, "layer", trackId, now);
          for (const clip of arrayValue(layer.clips)) {
            const clipId = stringValue(clip.id);
            const assetId = stringValue(clip.asset_id);
            if (!clipId || !cloudAssets.has(assetId)) continue;
            const clipData = objectValue(clip.data) ?? {};
            const offset = numberValue(clipData.timeline_offset);
            const cloudAsset = cloudAssets.get(assetId);
            const assetData = objectValue(cloudAsset?.data);
            const fps = numberValue(assetData?.fps);
            // The backend stamps an uploaded source clip with a placeholder
            // `{ duration: 1 }`; the cloud app plays such a clip for the
            // asset's own length, so the mirror must too. Render clips carry a
            // real duration of their own.
            const isSourceVideo =
              stringValue(layer.type) === "IMAGE" &&
              cloudAsset?.type !== "IMAGE" &&
              cloudAsset?.type !== "IMAGE_LIST";
            const sourceDuration = isSourceVideo
              ? numberValue(assetData?.duration)
              : 0;
            const duration =
              sourceDuration > 0
                ? sourceDuration
                : numberValue(clipData.duration);
            await database.insert(clips).values({
              id: clipId,
              trackId,
              assetId,
              name: stringValue(clip.name, "Clip"),
              timelineOffset: fps > 0 ? Math.round((offset / fps) * 1000) : 0,
              trimStart: null,
              trimEnd: null,
              dataJson: JSON.stringify({
                ...clipData,
                ...(duration > 0
                  ? { frame_range: [offset, offset + duration] }
                  : {})
              }),
              createdAt: now,
              updatedAt: now
            });
            await upsertCloudOriginLink(database, "clip", clipId, now);
          }
        }
      }
    });
  }

  private async removeMirroredContentKeepingLocalContent(
    database: MirrorDatabase,
    projectId: string,
    timelines: Record<string, unknown>[]
  ): Promise<void> {
    const incomingShotIds = new Set<string>();
    const incomingTrackIds = new Set<string>();
    for (const timeline of timelines) {
      const shotId = stringValue(timeline.id);
      if (!shotId) continue;
      incomingShotIds.add(shotId);
      for (const layer of arrayValue(timeline.layers)) {
        const trackId = stringValue(layer.id);
        if (trackId) incomingTrackIds.add(trackId);
      }
    }

    const oldTracks = await database
      .select({ id: tracks.id, shotId: tracks.shotId })
      .from(tracks)
      .where(eq(tracks.projectId, projectId));
    const oldClips = oldTracks.length
      ? await database
          .select({ id: clips.id, trackId: clips.trackId })
          .from(clips)
          .where(
            inArray(
              clips.trackId,
              oldTracks.map(({ id }) => id)
            )
          )
      : [];
    const { localOnlyTrackIds, localClipIds } = await this.findLocalContent(
      database,
      { oldTracks, oldClips, incomingTrackIds }
    );
    const cloudOwnedProjectAssetIds = await this.findCloudOwnedProjectAssetIds(
      database,
      projectId
    );

    const survivingTrackIds = new Set(
      oldTracks
        .filter(
          (track) =>
            incomingTrackIds.has(track.id) ||
            (localOnlyTrackIds.has(track.id) &&
              incomingShotIds.has(track.shotId))
        )
        .map(({ id }) => id)
    );
    const removedTrackIds = oldTracks
      .filter((track) => !survivingTrackIds.has(track.id))
      .map(({ id }) => id);
    const removedClipIds = oldClips
      .filter(
        (clip) =>
          !survivingTrackIds.has(clip.trackId) || !localClipIds.has(clip.id)
      )
      .map(({ id }) => id);

    if (removedClipIds.length > 0) {
      await database.delete(clips).where(inArray(clips.id, removedClipIds));
    }
    if (removedTrackIds.length > 0) {
      await database.delete(tracks).where(inArray(tracks.id, removedTrackIds));
    }
    await database
      .delete(shots)
      .where(
        and(
          eq(shots.projectId, projectId),
          notInArray(shots.id, [...incomingShotIds])
        )
      );
    await deleteCloudLinks(database, "layer", removedTrackIds);
    await deleteCloudLinks(database, "clip", removedClipIds);

    if (cloudOwnedProjectAssetIds.length > 0) {
      await database
        .delete(projectAssets)
        .where(
          and(
            eq(projectAssets.projectId, projectId),
            inArray(projectAssets.assetId, cloudOwnedProjectAssetIds)
          )
        );
    }
  }

  private async findLocalContent(
    database: MirrorDatabase,
    {
      oldTracks,
      oldClips,
      incomingTrackIds
    }: {
      oldTracks: { id: string }[];
      oldClips: { id: string; trackId: string }[];
      incomingTrackIds: Set<string>;
    }
  ): Promise<{ localOnlyTrackIds: Set<string>; localClipIds: Set<string> }> {
    const { cloudMirroredTrackIds, wasMirroredBeforeTrackLinksExisted } =
      await readCloudMirroredTracks(
        database,
        oldTracks.map(({ id }) => id)
      );
    if (wasMirroredBeforeTrackLinksExisted) {
      return { localOnlyTrackIds: new Set(), localClipIds: new Set() };
    }
    const oldClipIds = oldClips.map(({ id }) => id);
    const cloudMirroredClipIds = await readCloudLinkedLocalIds(
      database,
      "clip",
      oldClipIds
    );
    const cloudRenderPlaceholderClipIds = new Set(
      (oldClipIds.length
        ? await database
            .select({ clipId: cloudRenderJobs.clipId })
            .from(cloudRenderJobs)
            .where(inArray(cloudRenderJobs.clipId, oldClipIds))
        : []
      ).map(({ clipId }) => clipId)
    );
    const localClips = oldClips.filter(
      (clip) =>
        !cloudMirroredClipIds.has(clip.id) &&
        !cloudRenderPlaceholderClipIds.has(clip.id)
    );
    const trackIdsHoldingLocalClips = new Set(
      localClips.map(({ trackId }) => trackId)
    );
    const trackIdsHoldingAnyClip = new Set(
      oldClips.map(({ trackId }) => trackId)
    );
    const isCloudRenderPlaceholderTrack = (trackId: string) =>
      trackIdsHoldingAnyClip.has(trackId) &&
      !trackIdsHoldingLocalClips.has(trackId);
    const localOnlyTrackIds = new Set(
      oldTracks
        .filter(
          (track) =>
            !cloudMirroredTrackIds.has(track.id) &&
            !incomingTrackIds.has(track.id) &&
            !isCloudRenderPlaceholderTrack(track.id)
        )
        .map(({ id }) => id)
    );
    return {
      localOnlyTrackIds,
      localClipIds: new Set(localClips.map(({ id }) => id))
    };
  }

  private async findCloudOwnedProjectAssetIds(
    database: MirrorDatabase,
    projectId: string
  ): Promise<string[]> {
    const projectAssetIds = (
      await database
        .select({ assetId: projectAssets.assetId })
        .from(projectAssets)
        .where(eq(projectAssets.projectId, projectId))
    ).map(({ assetId }) => assetId);
    if (projectAssetIds.length === 0) return [];
    const assetLinks = await database
      .select({ localId: cloudLinks.localId, dataJson: cloudLinks.dataJson })
      .from(cloudLinks)
      .where(
        and(
          eq(cloudLinks.kind, "asset"),
          inArray(cloudLinks.localId, projectAssetIds)
        )
      );
    const cloudOriginAssetIds = new Set(
      assetLinks
        .filter((link) => isCloudOriginLinkData(link.dataJson))
        .map(({ localId }) => localId)
    );
    const cloudRenderPlaceholderAssetIds = new Set(
      (
        await database
          .select({ assetId: cloudRenderJobs.assetId })
          .from(cloudRenderJobs)
          .where(inArray(cloudRenderJobs.assetId, projectAssetIds))
      ).map(({ assetId }) => assetId)
    );
    return projectAssetIds.filter(
      (assetId) =>
        cloudOriginAssetIds.has(assetId) ||
        cloudRenderPlaceholderAssetIds.has(assetId)
    );
  }

  private async prepareAsset(
    projectId: string,
    assetId: string,
    asset: Record<string, unknown>,
    urls: { sourceUrl?: string; thumbnailUrl?: string } | undefined,
    signal?: AbortSignal
  ): Promise<{ source: CachedFile | null; thumbnail: CachedFile | null }> {
    const isImage = asset.type === "IMAGE" || asset.type === "IMAGE_LIST";
    const cachedThumbnail = urls?.thumbnailUrl
      ? await this.cacheRemoteFile(
          urls.thumbnailUrl,
          projectId,
          assetId,
          isImage ? "thumbnail" : "first-frame",
          "jpg",
          signal
        ).catch((error) => {
          if (signal?.aborted) throw error;
          console.warn(`Failed to cache cloud thumbnail ${assetId}`, error);
          return null;
        })
      : null;
    if (cachedThumbnail) {
      await this.persistPreparedAsset(assetId, {
        source: null,
        thumbnail: cachedThumbnail
      });
    }
    const source = urls?.sourceUrl
      ? await this.cacheRemoteFile(
          urls.sourceUrl,
          projectId,
          assetId,
          "source",
          isImage ? "jpg" : "mp4",
          signal
        ).catch((error) => {
          if (signal?.aborted) throw error;
          console.warn(`Failed to cache cloud asset ${assetId}`, error);
          return null;
        })
      : null;
    const thumbnail = cachedThumbnail ?? (isImage ? source : null);
    return { source, thumbnail };
  }

  private async persistPreparedAsset(
    assetId: string,
    prepared: { source: CachedFile | null; thumbnail: CachedFile | null }
  ): Promise<void> {
    if (!prepared.source && !prepared.thumbnail) return;
    await this.manager
      .get()
      .update(assets)
      .set({
        ...(prepared.source
          ? {
              sourcePath: prepared.source.absolutePath,
              relativeSourcePath: prepared.source.relativePath,
              sizeBytes: prepared.source.size,
              status: "available" as const
            }
          : {}),
        ...(prepared.thumbnail
          ? { thumbnailRelativePath: prepared.thumbnail.relativePath }
          : {})
      })
      .where(eq(assets.id, assetId));
  }

  private cacheRemoteFile(
    rawUrl: string,
    projectId: string,
    assetId: string,
    kind: "source" | "thumbnail" | "first-frame",
    fallbackExtension: string,
    signal?: AbortSignal
  ): Promise<CachedFile> {
    let url: URL;
    try {
      url = parseAllowedCloudStorageUrl(rawUrl, this.cloudStorage.allowedHosts);
    } catch (error) {
      return Promise.reject(error);
    }
    const projectHash = createHash("sha256")
      .update(projectId)
      .digest("hex")
      .slice(0, PROJECT_HASH_LENGTH);
    const assetHash = createHash("sha256")
      .update(assetId)
      .digest("hex")
      .slice(0, ASSET_HASH_LENGTH);
    const extension = safeExtension(rawUrl, fallbackExtension);
    const relativePath = path.join(
      "cloud-projects",
      projectHash,
      `${assetHash}-${kind}.${extension}`
    );
    const existing = this.downloads.get(relativePath);
    if (existing) return existing;
    const operation = this.downloadFile(url, relativePath, signal);
    this.downloads.set(relativePath, operation);
    const removeDownload = () => {
      if (this.downloads.get(relativePath) === operation) {
        this.downloads.delete(relativePath);
      }
    };
    void operation.then(removeDownload, removeDownload);
    return operation;
  }

  private async downloadFile(
    url: URL,
    relativePath: string,
    signal?: AbortSignal
  ): Promise<CachedFile> {
    if (signal?.aborted) throw signal.reason;
    const libraryRoot = await this.getLibraryRoot();
    const absolutePath = path.join(libraryRoot, relativePath);
    const existing = await stat(absolutePath).catch(() => null);
    if (existing?.isFile() && existing.size > 0) {
      return { absolutePath, relativePath, size: existing.size };
    }
    const temporaryPath = `${absolutePath}.partial`;
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await unlink(temporaryPath).catch(() => {});
    const download = await openCloudStorageDownload({
      ...this.cloudStorage,
      url: url.toString(),
      signal
    });
    try {
      await pipeline(download.body, createWriteStream(temporaryPath), {
        signal
      });
      const downloaded = await stat(temporaryPath);
      if (downloaded.size <= 0)
        throw new Error("Cloud project asset was empty");
      await publishFile(temporaryPath, absolutePath);
      return { absolutePath, relativePath, size: downloaded.size };
    } catch (error) {
      await unlink(temporaryPath).catch(() => {});
      throw error;
    }
  }
}
