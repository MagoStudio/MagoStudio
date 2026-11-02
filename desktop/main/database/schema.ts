import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
};

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  ...timestamps
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  settingsJson: text("settings_json").notNull().default("{}"),
  ...timestamps
});

export const shots = sqliteTable(
  "shots",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    settingsJson: text("settings_json").notNull().default("{}"),
    ...timestamps
  },
  (table) => [index("shots_project_id_idx").on(table.projectId)]
);

export const tracks = sqliteTable(
  "tracks",
  {
    id: text("id").primaryKey(),
    shotId: text("shot_id")
      .notNull()
      .references(() => shots.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull(),
    visible: integer("visible", { mode: "boolean" }).notNull().default(true),
    muted: integer("muted", { mode: "boolean" }).notNull().default(false),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    position: integer("position").notNull().default(0),
    rating: integer("rating").notNull().default(0),
    dataJson: text("data_json").notNull().default("{}"),
    ...timestamps
  },
  (table) => [
    index("tracks_shot_id_idx").on(table.shotId),
    index("tracks_project_id_idx").on(table.projectId)
  ]
);

export const assets = sqliteTable(
  "assets",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    origin: text("origin").notNull().default("uploaded"),
    sourcePath: text("source_path").notNull(),
    relativeSourcePath: text("relative_source_path"),
    sizeBytes: integer("size_bytes"),
    modifiedAtImport: integer("modified_at_import", { mode: "timestamp_ms" }),
    duration: integer("duration_ms"),
    fps: integer("fps_milli"),
    frameCount: integer("frame_count"),
    width: integer("width"),
    height: integer("height"),
    thumbnailRelativePath: text("thumbnail_relative_path"),
    status: text("status").notNull().default("available"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    rate: integer("rate").notNull().default(0),
    dataJson: text("data_json").notNull().default("{}"),
    ...timestamps
  },
  (table) => [index("assets_status_idx").on(table.status)]
);

export const clips = sqliteTable(
  "clips",
  {
    id: text("id").primaryKey(),
    trackId: text("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    timelineOffset: integer("timeline_offset_ms").notNull().default(0),
    trimStart: integer("trim_start_ms"),
    trimEnd: integer("trim_end_ms"),
    dataJson: text("data_json").notNull().default("{}"),
    ...timestamps
  },
  (table) => [
    index("clips_track_id_idx").on(table.trackId),
    index("clips_asset_id_idx").on(table.assetId)
  ]
);

export const projectAssets = sqliteTable(
  "project_assets",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "restrict" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`)
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.assetId] }),
    index("project_assets_asset_id_idx").on(table.assetId)
  ]
);

export const imageRenderJobs = sqliteTable(
  "image_render_jobs",
  {
    id: text("id").primaryKey(),
    providerRequestId: text("provider_request_id"),
    model: text("model").notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    shotId: text("shot_id")
      .notNull()
      .references(() => shots.id, { onDelete: "cascade" }),
    trackId: text("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    clipId: text("clip_id")
      .notNull()
      .references(() => clips.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("PENDING"),
    progress: integer("progress").notNull().default(0),
    requestJson: text("request_json").notNull(),
    error: text("error"),
    interacted: integer("interacted", { mode: "boolean" })
      .notNull()
      .default(false),
    startedAt: integer("started_at", { mode: "timestamp_ms" }),
    finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
    ...timestamps
  },
  (table) => [
    index("image_render_jobs_status_idx").on(table.status),
    index("image_render_jobs_project_id_idx").on(table.projectId)
  ]
);

/**
 * Maps a local record to its mirror in cloud Mago.
 *
 * Local ids are authoritative and never change; the cloud copy exists only so a
 * render job has somewhere to run. Keeping the correspondence here means the
 * mirror is derived and disposable: if the cloud loses a record we create a new
 * one and update the link, and nothing local is disturbed.
 *
 * Keyed by (kind, local_id) so one local row can be mirrored per record type.
 */
export const cloudLinks = sqliteTable(
  "cloud_links",
  {
    kind: text("kind").notNull(),
    localId: text("local_id").notNull(),
    cloudId: text("cloud_id").notNull(),
    /** Last time the mirror was confirmed to match, for staleness checks. */
    syncedAt: integer("synced_at", { mode: "timestamp_ms" }),
    /** Kind-specific state, e.g. an upload's ingestion status. */
    dataJson: text("data_json").notNull().default("{}"),
    ...timestamps
  },
  (table) => [
    primaryKey({ columns: [table.kind, table.localId] }),
    index("cloud_links_cloud_id_idx").on(table.kind, table.cloudId)
  ]
);

/**
 * A render submitted to cloud Mago, tracked locally so the UI can show it and so
 * a quit mid-render does not lose it.
 *
 * The local track, clip and asset rows are created at submit time and referenced
 * here, so the editor shows the job immediately without waiting for the cloud.
 * When the render finishes, the output is downloaded into the library and the
 * local asset becomes an ordinary local asset.
 */
export const cloudRenderJobs = sqliteTable(
  "cloud_render_jobs",
  {
    id: text("id").primaryKey(),
    cloudAssetId: text("cloud_asset_id"),
    cloudClipId: text("cloud_clip_id"),
    model: text("model").notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    shotId: text("shot_id")
      .notNull()
      .references(() => shots.id, { onDelete: "cascade" }),
    trackId: text("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    clipId: text("clip_id")
      .notNull()
      .references(() => clips.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("PENDING"),
    progress: integer("progress").notNull().default(0),
    requestJson: text("request_json").notNull(),
    error: text("error"),
    interacted: integer("interacted", { mode: "boolean" })
      .notNull()
      .default(false),
    startedAt: integer("started_at", { mode: "timestamp_ms" }),
    finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
    ...timestamps
  },
  (table) => [
    index("cloud_render_jobs_status_idx").on(table.status),
    index("cloud_render_jobs_project_id_idx").on(table.projectId)
  ]
);

/**
 * Durable cloud-to-local snapshots for agentic script-to-shots projects.
 *
 * The regular timeline editor is represented by the normalized tables above.
 * Script projects are owned by the cloud agent API and have a different read
 * model, so preserving that wire shape avoids maintaining a second local
 * implementation of casting, sheets and cut assembly. The snapshot is
 * read-only while offline.
 */
export const scriptProjectSnapshots = sqliteTable("script_project_snapshots", {
  projectId: text("project_id")
    .primaryKey()
    .references(() => projects.id, { onDelete: "cascade" }),
  stateJson: text("state_json"),
  scriptVersionsJson: text("script_versions_json"),
  planDetailsJson: text("plan_details_json"),
  cutJson: text("cut_json"),
  previewUrl: text("preview_url"),
  ...timestamps
});

/** Maps a stable media-cache id used by mago-media:// to its local file. */
export const scriptProjectMedia = sqliteTable(
  "script_project_media",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    sourceUrl: text("source_url").notNull(),
    relativePath: text("relative_path").notNull(),
    ...timestamps
  },
  (table) => [
    index("script_project_media_project_id_idx").on(table.projectId),
    index("script_project_media_source_url_idx").on(table.sourceUrl)
  ]
);

/**
 * The script project's agent chat, mirroring the backend's `chat_message`
 * rows: the user's turns and the assistant's replies, oldest first by
 * `created_at`. A reply is written PENDING when the turn is accepted and
 * rewritten COMPLETED or FAILED when the model answers, so the PENDING row is
 * also the job marker. At most one per project can be PENDING.
 */
export const scriptChatMessages = sqliteTable(
  "script_chat_messages",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    status: text("status", {
      enum: ["PENDING", "COMPLETED", "FAILED"]
    }).notNull(),
    content: text("content"),
    dataJson: text("data_json").notNull().default("{}"),
    ...timestamps
  },
  (table) => [
    index("script_chat_messages_project_created_idx").on(
      table.projectId,
      table.createdAt
    ),
    uniqueIndex("script_chat_messages_pending_per_project")
      .on(table.projectId)
      .where(sql`${table.status} = 'PENDING'`)
  ]
);
