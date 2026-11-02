import { z } from "zod";

/** An asset URL is trusted by the app to be fetched and assigned to media sources. Cloud HTTPS
 * and the desktop's isolated local-media protocol are accepted; everything else is treated as
 * absent rather than passed through to `fetch()` or an `<img>`/`<video>` src. */
const TrustedAssetUrlSchema = z
  .string()
  .nullable()
  .optional()
  .transform((url) =>
    url?.startsWith("https://") || url?.startsWith("mago-media://") ? url : null
  );

export const ProjectTypeSchema = z
  .enum(["timeline", "script_to_shots"])
  .catch("timeline");

export type ProjectType = z.infer<typeof ProjectTypeSchema>;

const SheetKindSchema = z.enum(["character", "environment", "prop"]);

export type SheetKind = z.infer<typeof SheetKindSchema>;

/** A shot's id in a casting summary: its sequence id normally, its atomic beat id ("3.1") for
 * an atomic cast, and one list can mix both when a project toggles `atomic_shots` between
 * casts. Only ever counted, never used as a number. */
const ShotSummaryIdSchema = z.union([z.number(), z.string()]);

/** A Shot's own key: its atomic beat id ("3.1") on an atomic project, its bare sequence number
 * on a non-atomic one, so the wire carries both types. Only ever read as a display label or a
 * lookup key, so both arrive here as a string. */
const ShotKeySchema = z.union([z.string(), z.number()]).transform(String);

/** Keeps the members it can read and drops the ones it cannot, instead of failing the whole
 * response. Reserved for a list whose loss costs more than its worst member: the project state's
 * Shots and reference-sheet groups gate the Shots and Assets tabs, so one unreadable field in
 * one member used to empty both tabs. A missing row is visible and recoverable; a missing
 * project reads as data loss. */
const arrayDroppingUnreadableMembers = <Schema extends z.ZodType>(
  schema: Schema
) =>
  z
    .array(z.unknown())
    .default([])
    .transform((members) =>
      members.flatMap((member) => {
        const parsedMember = schema.safeParse(member);
        return parsedMember.success ? [parsedMember.data] : [];
      })
    )
    .catch([]);

const CastingSummarySchema = z.object({
  keys_added: z.array(z.string()).default([]),
  keys_kept: z.array(z.string()).default([]),
  keys_unused: z.array(z.string()).default([]),
  shots_added: z.array(ShotSummaryIdSchema).default([]),
  shots_kept: z.array(ShotSummaryIdSchema).default([]),
  shots_dropped: z.array(ShotSummaryIdSchema).default([]),
  dropped_entities: z.array(z.unknown()).default([]),
  planned_total_s: z.number().nullable().optional(),
  target_duration_s: z.number().nullable().optional(),
  length_warning: z.string().nullable().optional()
});

type CastingSummary = z.infer<typeof CastingSummarySchema>;

const ScriptVersionSchema = z.object({
  version: z.number(),
  plan_id: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  max_shots: z.number().nullable().optional(),
  atomic_shots: z.boolean().optional(),
  sequential_shots: z.boolean().optional(),
  split_alts: z.boolean().optional(),
  separate_style: z.boolean().optional(),
  separate_camera: z.boolean().optional(),
  status: z.string().nullable().optional(),
  /* Degrades to no summary rather than rejecting the version. The summary is decorative and
   * the version list is load-bearing: one unexpected field in here failed the whole parse,
   * which emptied the Script tab and disabled every tab after it. */
  summary: CastingSummarySchema.nullable().optional().catch(null)
});

export type ScriptVersion = z.infer<typeof ScriptVersionSchema>;

export const ScriptVersionListSchema = z.object({
  active_version: z.number().nullable().optional(),
  versions: z.array(ScriptVersionSchema).default([])
});

export type ScriptVersionList = z.infer<typeof ScriptVersionListSchema>;

export const ActivatedScriptVersionSchema = z.object({
  active_version: z.number().nullable().optional(),
  summary: CastingSummarySchema.nullable().optional()
});

export type ActivatedScriptVersion = z.infer<
  typeof ActivatedScriptVersionSchema
>;

export const ScriptCastCreatedSchema = z.object({
  version: z.number(),
  plan_id: z.string()
});

export type ScriptCastCreated = z.infer<typeof ScriptCastCreatedSchema>;

const SheetImageSourceSchema = z.enum(["render", "upload"]).catch("render");

export type SheetImageSource = z.infer<typeof SheetImageSourceSchema>;

const SheetImageSchema = z.object({
  asset_id: z.string(),
  clip_id: z.string(),
  name: z.string().nullable().optional(),
  status: z.string(),
  source: SheetImageSourceSchema.default("render"),
  url: TrustedAssetUrlSchema,
  thumbnail_url: TrustedAssetUrlSchema,
  created_at: z.string().nullable().optional(),
  /** Exact prompt submitted for this image version. Older versions and uploads may not have
   * provenance recorded. */
  prompt: z.string().nullable().optional(),
  /** Backend render provenance used by version comparison, settings reuse and price
   * estimates (`render_model`, `output_size`). */
  render_spec: z.record(z.string(), z.unknown()).nullable().optional(),
  /** Frozen settings used to create this image version. */
  input_settings: z.record(z.string(), z.unknown()).nullable().optional(),
  /** Local renders expose their equivalent img2img settings under this key. */
  render_settings: z.record(z.string(), z.unknown()).nullable().optional(),
  /** Legacy desktop snapshots stored the same provenance under this key. */
  _local_render_spec: z.record(z.string(), z.unknown()).nullable().optional(),
  fingerprint: z.string().nullable().optional(),
  /** This version's own description, or `null` if it has none yet. Presence
   * (`has_description`) rather than truthiness distinguishes "never described" from a
   * deliberate blank. */
  description: z.string().nullable().optional(),
  has_description: z.boolean().default(false)
});

export type SheetImage = z.infer<typeof SheetImageSchema>;

export const SheetGroupSchema = z.object({
  token: z.string(),
  name: z.string(),
  kind: SheetKindSchema.nullable().optional(),
  /** Casting design variant. `default` is the base design; non-default values are grouped. */
  alt: z.string().nullable().optional(),
  /** Non-default variants are rendered by editing this slot's effective image. */
  master_token: z.string().nullable().optional(),
  is_design_master: z.boolean().optional(),
  body_plan: z.string().nullable().optional(),
  body_plan_auto: z.string().nullable().optional(),
  distinctive_features: z.array(z.string()).optional(),
  /** Pinned-wins: the effective image's own description once it has one, else the seed text.
   * This is what a render and a shot's composed video prompt actually use — never show it as a
   * per-version fallback, use `seed_description` for that instead. */
  description: z.string().nullable().optional(),
  /** Always the casting-seeded bootstrap text, regardless of which version is pinned or what
   * its own description says. The neutral "nothing generated yet" placeholder for a version
   * that has no description of its own. */
  seed_description: z.string().nullable().optional(),
  prompt: z.string().nullable().optional(),
  reference_asset_ids: z.array(z.string()).optional(),
  reference_instruction: z.string().nullable().optional(),
  enabled: z.boolean().default(true),
  layer_id: z.string(),
  layer_order: z.number().default(0),
  selected_asset_id: z.string().nullable().default(null),
  effective_asset_id: z.string().nullable().default(null),
  effective_source: SheetImageSourceSchema.nullable().default(null),
  images: z.array(SheetImageSchema).default([])
});

export type SheetGroup = z.infer<typeof SheetGroupSchema>;

/** How a Shot continues from the Shot before it. The predecessor is always the immediately
 * preceding Shot — the backend exposes no way to name a different one. */
export const SEQUENTIAL_SHOT_MODE_VALUES = [
  "last_frame",
  "key_frames"
] as const;

const SequentialShotModeSchema = z
  .enum(SEQUENTIAL_SHOT_MODE_VALUES)
  .catch("last_frame");

export type SequentialShotMode = z.infer<typeof SequentialShotModeSchema>;

/** `last_frame` only: `cut` to a new camera on the same moment, `pin` the frame as the
 * clip's opening (experimental), or `off` for the older look reference. */
export const SEQUENTIAL_OPENING_FRAME_VALUES = ["cut", "pin", "off"] as const;

const SequentialOpeningFrameSchema = z.enum(SEQUENTIAL_OPENING_FRAME_VALUES);

export type SequentialOpeningFrame = z.infer<
  typeof SequentialOpeningFrameSchema
>;

export const MIN_SEQUENTIAL_KEY_FRAMES = 1;
export const MAX_SEQUENTIAL_KEY_FRAMES = 4;
const MIN_SEQUENTIAL_CHUNK_SECONDS = 0.5;
const MAX_SEQUENTIAL_CHUNK_SECONDS = 10;

export const SequentialShotConfigSchema = z.object({
  enabled: z.boolean().default(false),
  mode: SequentialShotModeSchema.default("last_frame"),
  /** `key_frames` only: how many frames the VLM picks. Above 1 they are stitched into one. */
  num_select: z
    .number()
    .int()
    .min(MIN_SEQUENTIAL_KEY_FRAMES)
    .max(MAX_SEQUENTIAL_KEY_FRAMES)
    .nullable()
    .optional(),
  /** `last_chunk` only: how much of the predecessor's tail is sent as a reference video. */
  chunk_seconds: z
    .number()
    .min(MIN_SEQUENTIAL_CHUNK_SECONDS)
    .max(MAX_SEQUENTIAL_CHUNK_SECONDS)
    .nullable()
    .optional(),
  prompt_appendix: z.string().nullable().optional(),
  opening_frame: SequentialOpeningFrameSchema.nullable().optional().catch(null)
});

export type SequentialShotConfig = z.infer<typeof SequentialShotConfigSchema>;

const ShotTagsSchema = z.object({
  characters: z.array(z.string()).default([]),
  environments: z.array(z.string()).default([]),
  props: z.array(z.string()).default([])
});

export type ShotTags = z.infer<typeof ShotTagsSchema>;

const ShotReferenceSchema = z.object({
  token: z.string(),
  asset_id: z.string()
});

type ShotReference = z.infer<typeof ShotReferenceSchema>;

const MissingReferenceSchema = z.object({
  token: z.string(),
  reason: z.string()
});

type MissingReference = z.infer<typeof MissingReferenceSchema>;

export const ShotCameraSchema = z.object({
  framing: z.string().nullable().optional(),
  movement: z.string().nullable().optional(),
  lens: z.string().nullable().optional()
});

export type ShotCamera = z.infer<typeof ShotCameraSchema>;

export const ShotDialogueTurnSchema = z.object({
  speaker: z.string().nullable().optional(),
  speaker_token: z.string().nullable().optional(),
  line: z.string(),
  language: z.string().nullable().optional()
});

export type ShotDialogueTurn = z.infer<typeof ShotDialogueTurnSchema>;

const SCENE_STORYBOARD_STATUSES = [
  "missing",
  "generating",
  "ready",
  "stale",
  "failed"
] as const;

const SceneStoryboardSummarySchema = z.object({
  credits_per_render: z.number().nullable().optional(),
  shot_count: z.number().default(0),
  status: z.enum(SCENE_STORYBOARD_STATUSES).catch("missing"),
  enabled: z.boolean().default(true),
  selected_asset_id: z.string().nullable().optional(),
  effective_asset_id: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  panel_count: z.number().nullable().optional(),
  version_count: z.number().default(0),
  last_attempt_failed: z.boolean().default(false),
  generating_clip_id: z.string().nullable().optional(),
  generating_started_at: z.string().nullable().optional()
});

export type SceneStoryboardSummary = z.infer<
  typeof SceneStoryboardSummarySchema
>;

const SceneStoryboardVersionSchema = z.object({
  asset_id: z.string(),
  clip_id: z.string().nullable().optional(),
  status: z.string(),
  url: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  origin: z.string().nullable().optional(),
  base_asset_id: z.string().nullable().optional(),
  panel_count: z.number().nullable().optional(),
  prompt: z.string().nullable().optional()
});

export const SceneStoryboardResponseSchema = z.object({
  timeline_id: z.string(),
  storyboard: SceneStoryboardSummarySchema.extend({
    versions: z.array(SceneStoryboardVersionSchema).default([])
  })
});

export const SceneStoryboardSubmittedSchema = z.object({
  timeline_id: z.string(),
  clip_id: z.string().nullable().optional(),
  asset_id: z.string().nullable()
});

const ShotStateSchema = z.object({
  timeline_id: z.string(),
  shot_index: z.number(),
  sequence_id: z.number().nullable(),
  key: ShotKeySchema.nullable().optional(),
  dropped: z.boolean().default(false),
  hidden: z.boolean().default(false),
  manual: z.boolean().default(false),
  locked: z.boolean().optional(),
  heading: z.string().nullable().optional(),
  video_prompt: z.string().nullable().optional(),
  dialogue: z.array(ShotDialogueTurnSchema).optional(),
  camera: ShotCameraSchema.nullable().optional(),
  /** This shot's own render length. Pre-filled by an atomic cast from the beat's calibrated
   * pacing, or set by hand. `null` means the shot renders at the project-wide length. */
  duration_s: z.number().nullable().optional(),
  tags: ShotTagsSchema.default({
    characters: [],
    environments: [],
    props: []
  }),
  references: z.record(z.string(), z.array(ShotReferenceSchema)).default({}),
  missing_references: z.array(MissingReferenceSchema).default([]),
  /** `null` when the Shot has never opted in to continuing from its predecessor. */
  sequential: SequentialShotConfigSchema.nullable().optional().catch(null),
  /** Read-only: the continuation text the render uses — the Shot's own `prompt_appendix`, else
   * the default for its mode. `null` when the Shot is not sequential. */
  sequential_prompt: z.string().nullable().optional().catch(null),
  storyboard: SceneStoryboardSummarySchema.optional().catch(undefined)
});

export type ShotState = z.infer<typeof ShotStateSchema>;

/** Every continuation option's default text. A Shot's `sequential_prompt` only reflects its
 * saved option, so an option still being picked takes its text from here. */
const SequentialPromptDefaultsSchema = z.object({
  last_frame: z
    .object({
      cut: z.string().optional(),
      pin: z.string().optional(),
      off: z.string().optional()
    })
    .optional(),
  key_frames: z.string().optional(),
  last_chunk: z.string().optional()
});

export type SequentialPromptDefaults = z.infer<
  typeof SequentialPromptDefaultsSchema
>;

export const ProjectStateSchema = z.object({
  project_id: z.string(),
  sheets_timeline_id: z.string().nullable().default(null),
  visual_style: z.string().nullable().optional(),
  keys: arrayDroppingUnreadableMembers(SheetGroupSchema),
  shots: arrayDroppingUnreadableMembers(ShotStateSchema),
  sequential_prompt_defaults: SequentialPromptDefaultsSchema.nullable()
    .default(null)
    .catch(null)
});

export type ProjectState = z.infer<typeof ProjectStateSchema>;

const ShotOrderEntrySchema = z.object({
  timeline_id: z.string(),
  shot_index: z.number(),
  edited: z.boolean().nullable().optional()
});

export const EditedShotSchema = z.object({
  timeline_id: z.string(),
  locked: z.boolean().optional(),
  video_prompt: z.string().nullable().optional(),
  dialogue: z.array(ShotDialogueTurnSchema).optional(),
  duration_s: z.number().nullable().optional(),
  // The backend returns null when an older Shot has no stored tag block.
  tags: ShotTagsSchema.nullable().optional(),
  camera: ShotCameraSchema.nullable().optional(),
  sequential: SequentialShotConfigSchema.nullable().optional().catch(null),
  /** A lock-only edit does not mark Shot content as edited; the cloud returns that as null. */
  edited: z.boolean().nullable().optional(),
  hidden: z.boolean().optional(),
  shot_index: z.number().optional(),
  shots: z.array(ShotOrderEntrySchema).optional()
});

export type EditedShot = z.infer<typeof EditedShotSchema>;

export const ShotPinSchema = z.object({
  timeline_id: z.string(),
  pinned_asset_id: z.string().nullable().default(null)
});

export type ShotPin = z.infer<typeof ShotPinSchema>;

/** The backend's current shot-version provenance. The legacy string remains accepted below so
 * previously cached cloud/local cuts do not make the entire cut unreadable. */
const CutShotContinuationSchema = z
  .object({
    timeline_id: z.string(),
    asset_id: z.string(),
    mode: z.string(),
    reference_asset_id: z.string().nullable().optional()
  })
  .passthrough();

const CutShotVersionSchema = z.object({
  layer_id: z.string(),
  asset_id: z.string(),
  name: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  ready: z.boolean().default(false),
  status: z.string().default("pending"),
  url: TrustedAssetUrlSchema,
  poster_url: TrustedAssetUrlSchema,
  upscale_of: z.string().nullable().optional(),
  timeline_upscale_of: z.string().nullable().optional(),
  timeline_upscale_target: z.enum(["1080p", "1440p"]).nullable().optional(),
  input_settings: z.record(z.string(), z.unknown()).nullable().optional(),
  render_spec: z.record(z.string(), z.unknown()).nullable().optional(),
  fingerprint: z.string().nullable().optional(),
  size: z.tuple([z.number(), z.number()]).nullable().optional(),
  prompt_rewrite: z.string().nullable().optional(),
  prompt_source: z.string().nullable().optional(),
  continues_from: z
    .union([CutShotContinuationSchema, z.string()])
    .nullable()
    .optional(),
  sent_prompt: z.string().nullable().optional()
});

export type CutShotVersion = z.infer<typeof CutShotVersionSchema>;

const CutShotSchema = z.object({
  timeline_id: z.string(),
  shot_index: z.number(),
  sequence_id: z.number().nullable(),
  heading: z.string().nullable().optional(),
  asset_id: z.string().nullable().default(null),
  pinned_asset_id: z.string().nullable().default(null),
  version_name: z.string().nullable().optional(),
  is_upscale: z.boolean().default(false),
  url: TrustedAssetUrlSchema,
  poster_url: TrustedAssetUrlSchema,
  versions: z.array(CutShotVersionSchema).default([])
});

export type CutShot = z.infer<typeof CutShotSchema>;

const CutExportSchema = z.object({
  asset_id: z.string().nullable().optional(),
  plan_id: z.string().nullable().optional(),
  fingerprint: z.string().nullable().optional(),
  url: TrustedAssetUrlSchema,
  /** The file is a snapshot, so re-pinning a shot dates it without touching it. */
  stale: z.boolean().default(false)
});

export const ProjectCutSchema = z.object({
  project_id: z.string(),
  shots: z.array(CutShotSchema).default([]),
  hidden_shots: z.array(CutShotSchema).default([]),
  missing: z.array(z.number().nullable()).default([]),
  missing_timeline_ids: z.array(z.string()).default([]),
  export: CutExportSchema.nullable().default(null)
});

export type ProjectCut = z.infer<typeof ProjectCutSchema>;

const CutExportVideoProfileSchema = z.object({
  width: z.number().optional(),
  height: z.number().optional(),
  fps: z.number().optional(),
  sequence_ids: z.array(z.number().nullable()).default([]),
  timeline_ids: z.array(z.string()).default([])
});

const CutExportRefusalSchema = z.object({
  /** Left open rather than enumerated: a reason we do not know must still reach the fallback,
   * not fail parsing and look like a network error. */
  reason: z.string(),
  sequence_ids: z.array(z.number().nullable()).default([]),
  timeline_ids: z.array(z.string()).default([]),
  profiles: z.array(CutExportVideoProfileSchema).default([])
});

export type CutExportRefusal = z.infer<typeof CutExportRefusalSchema>;

export const CutExportDispatchSchema = z.object({
  would_export: z.array(z.number()).default([]),
  profile: CutExportVideoProfileSchema.nullable().default(null),
  refused: z.array(CutExportRefusalSchema).default([]),
  plan_id: z.string().nullable().default(null),
  asset_id: z.string().nullable().default(null),
  reused: z.boolean().default(false),
  message: z.string().nullable().optional()
});

export type CutExportDispatch = z.infer<typeof CutExportDispatchSchema>;

export const SheetGenerateResultSchema = z.object({
  would_run: z.array(z.string()).default([]),
  skipped: z
    .array(z.object({ token: z.string(), reason: z.string() }))
    .default([]),
  /** Per item that would run, the field paths that differ from its last render. */
  changed: z.record(z.string(), z.array(z.string())).default({}),
  plan_id: z.string().nullable().optional()
});

export type SheetGenerateResult = z.infer<typeof SheetGenerateResultSchema>;

const ShotAnswerReferenceShape = {
  sequence_id: z.number().nullable(),
  key: ShotKeySchema.nullable().optional(),
  timeline_id: z.string().nullable().optional()
};

/** Present only on a sequential block, never on a missing-references one. Classify on this,
 * never on the free-text `reason` sentence — that is for logs/support and can reword. */
const SequentialBlockedReasonCodeSchema = z
  .enum([
    "unsupported_engine",
    "predecessor_not_rendered",
    "unsupported_sequential_mode",
    "no_prompt",
    "no_reference_image",
    "duration_out_of_range",
    "unsupported_opening_frame"
  ])
  .nullable()
  .optional()
  .catch(null);

const WouldRunShotIdsShape = {
  would_run: z.array(z.number().nullable()).default([]),
  would_run_keys: z.array(ShotKeySchema).default([]),
  would_run_timeline_ids: z.array(z.string()).default([])
};

export const ShotGenerateResultSchema = z.object({
  ...WouldRunShotIdsShape,
  skipped: z
    .array(z.object({ ...ShotAnswerReferenceShape, reason: z.string() }))
    .default([]),
  blocked: z
    .array(
      z.object({
        ...ShotAnswerReferenceShape,
        missing: z.array(MissingReferenceSchema).default([]),
        /** Set instead of `missing` when a sequential Shot has nothing to continue from. */
        reason: z.string().nullable().optional(),
        reason_code: SequentialBlockedReasonCodeSchema
      })
    )
    .default([]),
  /** Shots told to continue from a predecessor that have none — today only the project's
   * first Shot. They render normally, without a cross-shot reference. A report, not a
   * refusal, so it must never be shown as an error. */
  sequential_ignored: z
    .array(z.object({ ...ShotAnswerReferenceShape, reason: z.string() }))
    .default([]),
  changed: z.record(z.string(), z.array(z.string())).default({}),
  changed_by_timeline_id: z.record(z.string(), z.array(z.string())).default({}),
  plan_id: z.string().nullable().optional()
});

export type ShotGenerateResult = z.infer<typeof ShotGenerateResultSchema>;

export const UpscaleResultSchema = z.object({
  ...WouldRunShotIdsShape,
  skipped: z
    .array(z.object({ ...ShotAnswerReferenceShape, reason: z.string() }))
    .default([]),
  blocked: z
    .array(z.object({ ...ShotAnswerReferenceShape, reason: z.string() }))
    .default([]),
  plan_id: z.string().nullable().optional()
});

export type UpscaleResult = z.infer<typeof UpscaleResultSchema>;

export const ScriptChatTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string()
});

export type ScriptChatTurn = z.infer<typeof ScriptChatTurnSchema>;

export const ScriptChatMessageStatusSchema = z.enum([
  "PENDING",
  "COMPLETED",
  "FAILED"
]);

export type ScriptChatMessageStatus = z.infer<
  typeof ScriptChatMessageStatusSchema
>;

export const ScriptChatFunctionCallSchema = z.object({
  name: z.string(),
  args: z.record(z.string(), z.unknown()).optional()
});

export type ScriptChatFunctionCall = z.infer<
  typeof ScriptChatFunctionCallSchema
>;

export const ScriptChatMessageRowSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  status: ScriptChatMessageStatusSchema,
  error: z.string().nullable().optional(),
  content: z.string(),
  function_call: ScriptChatFunctionCallSchema.nullable().optional(),
  function_calls: z.array(ScriptChatFunctionCallSchema).nullable().optional(),
  created_at: z.string()
});

export type ScriptChatMessageRow = z.infer<typeof ScriptChatMessageRowSchema>;

export const GetScriptChatMessagesResponseSchema = z.object({
  project_id: z.string(),
  pending: z.boolean(),
  messages: arrayDroppingUnreadableMembers(ScriptChatMessageRowSchema)
});

export type GetScriptChatMessagesResponse = z.infer<
  typeof GetScriptChatMessagesResponseSchema
>;

const AgentScriptContinuityCharacterSchema = z.object({
  name: z.string(),
  description: z.string()
});

const AgentScriptContinuityBibleSchema = z.object({
  characters: z.array(AgentScriptContinuityCharacterSchema).default([]),
  setting: z.string().default(""),
  style: z.string().default("")
});

/** `prompt` is the only field shown, joined with its siblings — see CONTEXT.md's "Agent script
 * document". */
const AgentScriptSceneSchema = z.object({
  scene_number: z.number(),
  duration_sec: z.number().nullable().optional(),
  prompt: z.string(),
  dialogue_or_vo: z.string().nullable().optional(),
  on_screen_text: z.string().nullable().optional(),
  sfx_music_note: z.string().nullable().optional(),
  reference_tags: z.array(z.string()).default([]),
  notes: z.string().nullable().optional()
});

export type AgentScriptScene = z.infer<typeof AgentScriptSceneSchema>;

const AgentScreenplayElementSchema = z.object({
  type: z.string(),
  text: z.string().default(""),
  character: z.string().nullable().optional(),
  extension: z.string().nullable().optional(),
  parenthetical: z.string().nullable().optional()
});

export type AgentScreenplayElement = z.infer<
  typeof AgentScreenplayElementSchema
>;

const AgentScreenplaySceneSchema = z.object({
  scene_number: z.number(),
  heading: z.string().default(""),
  elements: z.array(AgentScreenplayElementSchema).default([])
});

export type AgentScreenplayScene = z.infer<typeof AgentScreenplaySceneSchema>;

/** See CONTEXT.md's "Agent script document" — supersedes the original fenced-JSON output contract. */
export const AgentScriptDocumentSchema = z.object({
  series_title: z.string().nullable().optional(),
  episode_title: z.string().nullable().optional(),
  target_duration_sec: z.number().nullable().optional(),
  aspect_ratio: z.string().nullable().optional(),
  continuity_bible: AgentScriptContinuityBibleSchema.nullable().optional(),
  scenes: z.array(AgentScriptSceneSchema).default([]),
  screenplay_scenes: z.array(AgentScreenplaySceneSchema).default([]),
  caption: z.string().nullable().optional(),
  hashtags: z.array(z.string()).default([])
});

export type AgentScriptDocument = z.infer<typeof AgentScriptDocumentSchema>;
