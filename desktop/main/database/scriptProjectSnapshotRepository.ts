import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import { and, eq, isNull, sql } from "drizzle-orm";

import { resolveCloudConfig } from "../../shared/cloudConfig";
import type {
  LocalScriptProjectSnapshot,
  LocalScriptProjectSnapshotInput
} from "../../shared/contracts";
import {
  openCloudStorageDownload,
  type CloudStorageAccess
} from "../cloudStorage/openCloudStorageDownload";
import { parseAllowedCloudStorageUrl } from "../cloudStorage/parseAllowedCloudStorageUrl";
import { createImageThumbnail } from "../media/imageThumbnail";
import { atomicWriteFile, publishFile } from "../storage/atomicFile";
import { storedObject } from "../storage/storedJson";

import { DatabaseManager } from "./databaseManager";
import { projects, scriptProjectMedia, scriptProjectSnapshots } from "./schema";

const MEDIA_URL_KEYS = new Set(["url", "thumbnail_url", "poster_url"]);
const PROJECT_DIRECTORY_HASH_LENGTH = 32;
const MAX_CONCURRENT_MEDIA_DOWNLOADS = 6;
const MAX_CONCURRENT_THUMBNAIL_BUILDS = 2;

export const optimizedThumbnailUrl = (value: string): string => {
  try {
    const url = new URL(value);
    if (url.protocol !== "mago-media:") return value;
    if (url.hostname === "asset") {
      return `mago-media://thumbnail${url.pathname}`;
    }
    if (url.hostname === "script-project") {
      return `mago-media://script-project-thumbnail${url.pathname}`;
    }
  } catch {
    // Preserve malformed legacy values; the image component will show its
    // normal broken-image state rather than making snapshot reads fail.
  }
  return value;
};

const stableMediaUrl = (value: string): string => {
  try {
    const url = new URL(value);
    return url.origin + url.pathname;
  } catch {
    return value;
  }
};
const parseJson = (
  value: string | null,
  cachedMedia = new Map<string, string>()
): Record<string, unknown> | null => {
  if (!value) return null;
  try {
    // The reviver upgrades legacy thumbnail URLs during the JSON parse we
    // already have to perform, avoiding a second traversal of large snapshots.
    const parsed: unknown = JSON.parse(value, (key, member: unknown) => {
      if (!MEDIA_URL_KEYS.has(key) || typeof member !== "string") return member;
      const localized = cachedMedia.get(stableMediaUrl(member)) ?? member;
      return key === "thumbnail_url"
        ? optimizedThumbnailUrl(localized)
        : localized;
    });
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const objectValue = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const hasRemoteMedia = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(hasRemoteMedia);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(
    ([key, member]) =>
      (MEDIA_URL_KEYS.has(key) &&
        typeof member === "string" &&
        member.startsWith("https://")) ||
      hasRemoteMedia(member)
  );
};

const dateValue = (value: unknown, fallback: Date): Date => {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? fallback : parsed;
};

const mediaExtension = (contentType: string | undefined, url: URL): string => {
  const normalized = contentType?.split(";", 1)[0]?.trim().toLowerCase();
  const fromType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm"
  };
  if (normalized && fromType[normalized]) return fromType[normalized];
  const candidate = path.extname(url.pathname).slice(1).toLowerCase();
  return /^(?:jpe?g|png|webp|mp4|mov|webm)$/.test(candidate)
    ? candidate
    : "bin";
};

type LocalizedMedia = { url: string; isImage: boolean };

export class ScriptProjectSnapshotRepository {
  private readonly downloads = new Map<string, Promise<LocalizedMedia>>();
  private readonly thumbnailJobs = new Map<string, Promise<string | null>>();
  private readonly pendingThumbnailStarts: Array<() => void> = [];
  private activeThumbnailBuilds = 0;
  private readonly pendingDownloadStarts: Array<() => void> = [];
  private activeMediaDownloads = 0;
  private readonly scheduledDownloads = new Map<string, AbortController>();

  constructor(
    private readonly manager: DatabaseManager,
    private readonly getLibraryRoot: () => Promise<string>,
    private readonly cloudStorage: CloudStorageAccess = {
      allowedHosts: resolveCloudConfig().cloudStorageHosts
    }
  ) {}

  async put(input: LocalScriptProjectSnapshotInput): Promise<void> {
    const projectRowAcceptsSnapshot = await this.ensureProject(
      input.projectId,
      input.project
    );
    if (!projectRowAcceptsSnapshot) return;

    // Cloud mirrors persist metadata immediately and schedule media separately.
    // get() resolves already cached URLs without waiting for network transfers.
    // Other callers retain the durable, fully localized write behavior.
    if (
      !input.metadataOnly &&
      (hasRemoteMedia(input.state) || hasRemoteMedia(input.cut))
    ) {
      await this.localizeSnapshotMedia(input);
      return;
    }

    const snapshotValues = this.snapshotValues(input);
    if (Object.keys(snapshotValues).length > 0) {
      await this.writeSnapshot(input.projectId, snapshotValues);
    }
  }

  private async localizeSnapshotMedia(
    input: LocalScriptProjectSnapshotInput
  ): Promise<void> {
    const localizedValues: Record<string, string | null> = {};
    let previewUrl: string | null = null;
    for (const [inputKey, columnKey] of [
      ["state", "stateJson"],
      ["scriptVersions", "scriptVersionsJson"],
      ["planDetails", "planDetailsJson"],
      ["cut", "cutJson"]
    ] as const) {
      const value = input[inputKey];
      if (!value) continue;
      const localized = await this.localizeMedia(
        input.projectId,
        value,
        (media) => {
          if (!previewUrl && media.isImage) previewUrl = media.url;
        }
      );
      localizedValues[columnKey] = JSON.stringify(localized);
    }
    if (previewUrl) localizedValues.previewUrl = previewUrl;
    if (Object.keys(localizedValues).length > 0) {
      await this.writeSnapshot(input.projectId, localizedValues);
    }
  }

  async get(projectId: string): Promise<LocalScriptProjectSnapshot | null> {
    if (!this.manager.isOpen()) return null;
    const [snapshot] = await this.manager
      .get()
      .select()
      .from(scriptProjectSnapshots)
      .where(eq(scriptProjectSnapshots.projectId, projectId))
      .limit(1);
    if (!snapshot) return null;
    const parsed = this.validateSnapshot(snapshot);
    // Parse once, then inspect just the URL fields. JSON.parse's reviver runs
    // for every scalar in the (often large) render/plan history on every read.
    const fields: Array<{
      owner: Record<string, unknown>;
      key: string;
      value: string;
    }> = [];
    const pending: unknown[] = Object.values(parsed);
    while (pending.length) {
      const item = pending.pop();
      if (!item || typeof item !== "object") continue;
      if (Array.isArray(item)) {
        for (const child of item)
          if (child && typeof child === "object") pending.push(child);
        continue;
      }
      const owner = item as Record<string, unknown>;
      for (const [key, value] of Object.entries(owner)) {
        if (MEDIA_URL_KEYS.has(key) && typeof value === "string")
          fields.push({ owner, key, value });
        else if (value && typeof value === "object") pending.push(value);
      }
    }
    const stableUrls = new Map<string, string>();
    const stableUrl = (value: string): string => {
      let stable = stableUrls.get(value);
      if (stable === undefined) {
        stable = stableMediaUrl(value);
        stableUrls.set(value, stable);
      }
      return stable;
    };
    const referencedUrls = new Set(fields.map(({ value }) => stableUrl(value)));
    const mediaRows = await this.manager
      .get()
      .select()
      .from(scriptProjectMedia)
      .where(eq(scriptProjectMedia.projectId, projectId));
    const cachedMedia = new Map<string, string>();
    // Already-local URLs need no disk verification to be returned. Only a
    // remote URL being replaced by a cached file depends on that file existing.
    const referencedMedia = mediaRows.filter((media) =>
      referencedUrls.has(stableUrl(media.sourceUrl))
    );
    const libraryRoot = referencedMedia.length
      ? await this.getLibraryRoot()
      : "";
    await Promise.all(
      referencedMedia.map(async (media) => {
        const file = await stat(
          path.join(libraryRoot, media.relativePath)
        ).catch(() => null);
        if (file?.isFile() && file.size > 0 && media.sourceUrl)
          cachedMedia.set(
            stableUrl(media.sourceUrl),
            `mago-media://script-project/${media.id}`
          );
      })
    );
    const thumbnails = new Map<string, string>();
    for (const { owner, key, value } of fields) {
      const localized = cachedMedia.get(stableUrl(value)) ?? value;
      if (key === "thumbnail_url") {
        let thumbnail = thumbnails.get(localized);
        if (thumbnail === undefined) {
          thumbnail = optimizedThumbnailUrl(localized);
          thumbnails.set(localized, thumbnail);
        }
        owner[key] = thumbnail;
      } else owner[key] = localized;
    }
    return parsed;
  }

  /** Downloads one HTTPS media file into the project, as snapshots do. */
  async cacheScheduledMedia(
    projectId: string,
    sourceUrl: string
  ): Promise<void> {
    const key = JSON.stringify([projectId, stableMediaUrl(sourceUrl)]);
    const controller = new AbortController();
    this.scheduledDownloads.set(key, controller);
    try {
      const media = await this.cacheMedia(
        projectId,
        sourceUrl,
        controller.signal
      );
      if (media.isImage) {
        await this.manager
          .get()
          .update(scriptProjectSnapshots)
          .set({ previewUrl: media.url })
          .where(
            and(
              eq(scriptProjectSnapshots.projectId, projectId),
              isNull(scriptProjectSnapshots.previewUrl)
            )
          );
      }
    } finally {
      if (this.scheduledDownloads.get(key) === controller)
        this.scheduledDownloads.delete(key);
    }
  }

  cancelScheduledMedia(projectId: string, sourceUrl: string): void {
    this.scheduledDownloads
      .get(JSON.stringify([projectId, stableMediaUrl(sourceUrl)]))
      ?.abort();
  }

  /** Downloads one HTTPS media file into the project, as snapshots do. */
  async storeRemoteMedia(
    projectId: string,
    sourceUrl: string
  ): Promise<{ id: string; url: string; isImage: boolean }> {
    const media = await this.cacheMedia(projectId, sourceUrl);
    return { ...media, id: media.url.replace(/^.*\//, "") };
  }

  /** Every project that has a snapshot, cloud mirrors included. */
  async listProjectIds(): Promise<string[]> {
    if (!this.manager.isOpen()) return [];
    const rows = await this.manager
      .get()
      .select({ projectId: scriptProjectSnapshots.projectId })
      .from(scriptProjectSnapshots);
    return rows.map((row) => row.projectId);
  }

  async getPlan(planId: string): Promise<Record<string, unknown> | null> {
    if (!this.manager.isOpen()) return null;
    // Filter in SQLite so progress polling transfers/parses only the requested
    // plan. json_each keys are bound values, including IDs containing quotes.
    // Preserve the old reader's tolerance for absent or malformed plan maps.
    const planMap = sql`CASE WHEN json_valid(${scriptProjectSnapshots.planDetailsJson})
      THEN CASE WHEN json_type(${scriptProjectSnapshots.planDetailsJson}) = 'object'
        THEN ${scriptProjectSnapshots.planDetailsJson} ELSE '{}' END
      ELSE '{}' END`;
    const [row] = await this.manager
      .get()
      .select({ plan: sql<string>`entry.value` })
      .from(sql`${scriptProjectSnapshots}, json_each(${planMap}) AS entry`)
      .where(sql`entry.key = ${planId} AND entry.type = 'object'`)
      .limit(1);
    return row ? parseJson(row.plan) : null;
  }

  async putPlan(
    projectId: string,
    planId: string,
    plan: Record<string, unknown>
  ): Promise<void> {
    const current = await this.get(projectId);
    await this.put({
      projectId,
      planDetails: { ...(current?.planDetails ?? {}), [planId]: plan }
    });
  }

  async storeGeneratedMedia(
    projectId: string,
    bytes: Buffer,
    extension: "png" | "mp4",
    useAsPreview = false
  ): Promise<{ id: string; url: string; path: string }> {
    const id = createHash("sha256")
      .update(projectId)
      .update(bytes)
      .digest("hex");
    const projectDirectory = createHash("sha256")
      .update(projectId)
      .digest("hex")
      .slice(0, PROJECT_DIRECTORY_HASH_LENGTH);
    const relativePath = path.join(
      "script-projects",
      projectDirectory,
      `${id}.${extension}`
    );
    const libraryRoot = await this.getLibraryRoot();
    const absolutePath = path.join(libraryRoot, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await atomicWriteFile(absolutePath, bytes);
    const now = new Date();
    await this.manager
      .get()
      .insert(scriptProjectMedia)
      .values({
        id,
        projectId,
        sourceUrl: `local-generated:${id}`,
        relativePath,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: scriptProjectMedia.id,
        set: { relativePath, updatedAt: now }
      });
    const url = `mago-media://script-project/${id}`;
    if (useAsPreview) {
      await this.writeSnapshot(projectId, { previewUrl: url });
    }
    return { id, url, path: absolutePath };
  }

  async getListSummary(projectId: string): Promise<{
    previewUrl: string | null;
    shotCount: number;
    renderCount: number;
  } | null> {
    if (!this.manager.isOpen()) return null;
    const [snapshot] = await this.manager
      .get()
      .select()
      .from(scriptProjectSnapshots)
      .where(eq(scriptProjectSnapshots.projectId, projectId))
      .limit(1);
    if (!snapshot) return null;
    const state = parseJson(snapshot.stateJson);
    const cut = parseJson(snapshot.cutJson);
    return {
      previewUrl: snapshot.previewUrl,
      shotCount: Array.isArray(state?.shots) ? state.shots.length : 0,
      renderCount: Array.isArray(cut?.shots)
        ? cut.shots.filter(
            (shot) => objectValue(shot)?.url || objectValue(shot)?.asset_id
          ).length
        : 0
    };
  }

  async resolveMediaPath(mediaId: string): Promise<string | null> {
    if (!this.manager.isOpen()) return null;
    const [media] = await this.manager
      .get()
      .select()
      .from(scriptProjectMedia)
      .where(eq(scriptProjectMedia.id, mediaId))
      .limit(1);
    if (!media) return null;
    const libraryRoot = await this.getLibraryRoot();
    const resolvedRoot = path.resolve(libraryRoot);
    const resolvedPath = path.resolve(resolvedRoot, media.relativePath);
    if (!resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) return null;
    return resolvedPath;
  }

  /** Sidecars avoid overwriting a cut snapshot while another shot finishes. */
  async getMediaMetrics(
    mediaId: string
  ): Promise<Record<string, unknown> | null> {
    const mediaPath = await this.resolveMediaPath(mediaId);
    if (!mediaPath) throw new Error("Local video is unavailable");
    try {
      return parseJson(await readFile(`${mediaPath}.metrics.json`, "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async putMediaMetrics(
    mediaId: string,
    metrics: Record<string, unknown>
  ): Promise<void> {
    const mediaPath = await this.resolveMediaPath(mediaId);
    if (!mediaPath) throw new Error("Local video is unavailable");
    const target = `${mediaPath}.metrics.json`;
    await atomicWriteFile(target, JSON.stringify(metrics), "utf8");
  }

  async resolveThumbnailMediaPath(mediaId: string): Promise<string | null> {
    const active = this.thumbnailJobs.get(mediaId);
    if (active) return active;
    const job = this.createThumbnail(mediaId).finally(() => {
      if (this.thumbnailJobs.get(mediaId) === job) {
        this.thumbnailJobs.delete(mediaId);
      }
    });
    this.thumbnailJobs.set(mediaId, job);
    return job;
  }

  private async createThumbnail(mediaId: string): Promise<string | null> {
    const sourcePath = await this.resolveMediaPath(mediaId);
    if (!sourcePath) return null;
    const thumbnailPath = `${sourcePath}.thumbnail.jpg`;
    const temporaryPath = `${thumbnailPath}.partial`;
    try {
      const existing = await stat(thumbnailPath);
      if (existing.isFile() && existing.size > 0) return thumbnailPath;
    } catch {
      // Existing projects create their thumbnail on the first visible request.
    }

    await this.acquireThumbnailSlot();
    try {
      await unlink(temporaryPath).catch(() => {});
      await createImageThumbnail(sourcePath, temporaryPath);
      await publishFile(temporaryPath, thumbnailPath);
      return thumbnailPath;
    } catch {
      await unlink(temporaryPath).catch(() => {});
      // Keep the card usable if this particular format cannot be decoded.
      return sourcePath;
    } finally {
      const next = this.pendingThumbnailStarts.shift();
      if (next) next();
      else this.activeThumbnailBuilds -= 1;
    }
  }

  private async acquireThumbnailSlot(): Promise<void> {
    if (this.activeThumbnailBuilds < MAX_CONCURRENT_THUMBNAIL_BUILDS) {
      this.activeThumbnailBuilds += 1;
      return;
    }
    await new Promise<void>((resolve) => {
      this.pendingThumbnailStarts.push(resolve);
    });
  }

  private snapshotValues(
    input: LocalScriptProjectSnapshotInput
  ): Record<string, string | null> {
    return {
      ...(input.state ? { stateJson: JSON.stringify(input.state) } : {}),
      ...(input.scriptVersions
        ? { scriptVersionsJson: JSON.stringify(input.scriptVersions) }
        : {}),
      ...(input.planDetails
        ? { planDetailsJson: JSON.stringify(input.planDetails) }
        : {}),
      ...(input.cut ? { cutJson: JSON.stringify(input.cut) } : {})
    };
  }

  private async ensureProject(
    projectId: string,
    project: Record<string, unknown> | undefined
  ): Promise<boolean> {
    const now = new Date();
    const database = this.manager.get();
    const [existing] = await database
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    const existingSettings = parseJson(existing?.settingsJson ?? null) ?? {};
    const existingRowIsLocalProject =
      !!existing && existingSettings.origin !== "cloud";
    const isCloudWriteOverLocalProject = !!project && existingRowIsLocalProject;
    if (isCloudWriteOverLocalProject) return false;
    const projectSettings = objectValue(project?.settings) ?? {};
    const settings = {
      ...existingSettings,
      ...projectSettings,
      type: "script_to_shots",
      origin: "cloud"
    };
    const createdAt = dateValue(
      project?.created_at,
      existing?.createdAt ?? now
    );
    const values = {
      id: projectId,
      name:
        typeof project?.name === "string" && project.name.trim()
          ? project.name
          : "Script project",
      description:
        typeof project?.description === "string" ? project.description : "",
      active: typeof project?.active === "boolean" ? project.active : true,
      settingsJson: JSON.stringify(settings),
      createdAt,
      updatedAt: createdAt
    };
    if (!project) {
      await database.insert(projects).values(values).onConflictDoNothing();
      return true;
    }
    await database
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
    return true;
  }

  private validateSnapshot(
    snapshot: typeof scriptProjectSnapshots.$inferSelect
  ): LocalScriptProjectSnapshot {
    const parsed: Record<
      keyof LocalScriptProjectSnapshot,
      Record<string, unknown> | null
    > = {
      state: null,
      scriptVersions: null,
      planDetails: null,
      cut: null
    };
    for (const [key, field] of [
      ["stateJson", "state"],
      ["scriptVersionsJson", "scriptVersions"],
      ["planDetailsJson", "planDetails"],
      ["cutJson", "cut"]
    ] as const) {
      if (snapshot[key] !== null)
        parsed[field] = storedObject(snapshot[key], {
          id: `project:${snapshot.projectId}:${key}`,
          kind: "project",
          projectId: snapshot.projectId,
          message: `Could not read ${key.replace("Json", "")} for project ${snapshot.projectId}. Original data has been kept; recover a database backup to restore it.`
        });
    }
    return {
      ...parsed,
      planDetails:
        parsed.planDetails as LocalScriptProjectSnapshot["planDetails"]
    };
  }

  private async writeSnapshot(
    projectId: string,
    values: Record<string, string | null>
  ): Promise<void> {
    const [existing] = await this.manager
      .get()
      .select()
      .from(scriptProjectSnapshots)
      .where(eq(scriptProjectSnapshots.projectId, projectId))
      .limit(1);
    if (existing) this.validateSnapshot(existing);
    const now = new Date();
    await this.manager
      .get()
      .insert(scriptProjectSnapshots)
      .values({ projectId, ...values, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: scriptProjectSnapshots.projectId,
        set: { ...values, updatedAt: now }
      });
  }

  private async localizeMedia(
    projectId: string,
    value: unknown,
    onMedia: (media: LocalizedMedia) => void
  ): Promise<unknown> {
    if (Array.isArray(value)) {
      return Promise.all(
        value.map((member) => this.localizeMedia(projectId, member, onMedia))
      );
    }
    if (!value || typeof value !== "object") return value;

    const entries = await Promise.all(
      Object.entries(value).map(async ([key, member]) => {
        if (
          MEDIA_URL_KEYS.has(key) &&
          typeof member === "string" &&
          member.startsWith("https://")
        ) {
          try {
            const media = await this.cacheMedia(projectId, member);
            onMedia(media);
            return [key, media.url] as const;
          } catch (error) {
            console.warn("Failed to cache script-project media", error);
            return [key, member] as const;
          }
        }
        return [
          key,
          await this.localizeMedia(projectId, member, onMedia)
        ] as const;
      })
    );
    return Object.fromEntries(entries);
  }

  private cacheMedia(
    projectId: string,
    sourceUrl: string,
    cancelBeforeTransferStarts?: AbortSignal
  ): Promise<LocalizedMedia> {
    const parsedUrl = parseAllowedCloudStorageUrl(
      sourceUrl,
      this.cloudStorage.allowedHosts
    );
    // Signed CDN query strings rotate. Cache by the immutable asset path so a
    // refreshed signature does not download another copy of the same media.
    const stableSource = `${parsedUrl.origin}${parsedUrl.pathname}`;
    const mediaId = createHash("sha256")
      .update(`${projectId}\0${stableSource}`)
      .digest("hex");
    const existingDownload = this.downloads.get(mediaId);
    if (existingDownload) return existingDownload;
    const download = this.withDownloadSlot(() =>
      this.performMediaDownload(
        projectId,
        mediaId,
        sourceUrl,
        cancelBeforeTransferStarts
      )
    );
    this.downloads.set(mediaId, download);
    void download.then(
      () => {
        if (this.downloads.get(mediaId) === download)
          this.downloads.delete(mediaId);
      },
      () => {
        if (this.downloads.get(mediaId) === download)
          this.downloads.delete(mediaId);
      }
    );
    return download;
  }

  private async withDownloadSlot<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquireDownloadSlot();
    try {
      return await operation();
    } finally {
      const next = this.pendingDownloadStarts.shift();
      if (next) next();
      else this.activeMediaDownloads -= 1;
    }
  }

  private async acquireDownloadSlot(): Promise<void> {
    if (this.activeMediaDownloads < MAX_CONCURRENT_MEDIA_DOWNLOADS) {
      this.activeMediaDownloads += 1;
      return;
    }
    await new Promise<void>((resolve) => {
      this.pendingDownloadStarts.push(resolve);
    });
  }

  private async performMediaDownload(
    projectId: string,
    mediaId: string,
    sourceUrl: string,
    cancelBeforeTransferStarts?: AbortSignal
  ): Promise<LocalizedMedia> {
    const database = this.manager.get();
    const [cached] = await database
      .select()
      .from(scriptProjectMedia)
      .where(eq(scriptProjectMedia.id, mediaId))
      .limit(1);
    const libraryRoot = await this.getLibraryRoot();
    if (cached) {
      const existingPath = path.join(libraryRoot, cached.relativePath);
      try {
        const existingFile = await stat(existingPath);
        if (existingFile.isFile() && existingFile.size > 0) {
          return {
            url: `mago-media://script-project/${cached.id}`,
            isImage: /\.(?:jpe?g|png|webp)$/i.test(existingPath)
          };
        }
      } catch {
        // The row survived but the file did not; download it again below.
      }
    }

    const url = new URL(sourceUrl);
    cancelBeforeTransferStarts?.throwIfAborted();
    const download = await openCloudStorageDownload({
      ...this.cloudStorage,
      url: sourceUrl
    });
    const contentType = download.headers.get("content-type") ?? undefined;
    const extension = mediaExtension(contentType, url);
    const projectDirectory = createHash("sha256")
      .update(projectId)
      .digest("hex")
      .slice(0, PROJECT_DIRECTORY_HASH_LENGTH);
    const relativePath = path.join(
      "script-projects",
      projectDirectory,
      `${mediaId}.${extension}`
    );
    const destination = path.join(libraryRoot, relativePath);
    const temporary = `${destination}.partial`;
    await mkdir(path.dirname(destination), { recursive: true });
    await unlink(temporary).catch(() => {});
    try {
      await pipeline(download.body, createWriteStream(temporary));
      if ((await stat(temporary)).size === 0) {
        throw new Error("Downloaded script-project media was empty");
      }
      await publishFile(temporary, destination);
    } catch (error) {
      await unlink(temporary).catch(() => {});
      throw error;
    }

    const now = new Date();
    await database
      .insert(scriptProjectMedia)
      .values({
        id: mediaId,
        projectId,
        sourceUrl,
        relativePath,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: scriptProjectMedia.id,
        set: { sourceUrl, relativePath, updatedAt: now }
      });
    return {
      url: `mago-media://script-project/${mediaId}`,
      isImage: /^(?:jpg|jpeg|png|webp)$/.test(extension)
    };
  }
}
