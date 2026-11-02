import { RenderMode } from "@hooks/types";
import { VideoEngine } from "@models/video/types";
import {
  MAX_SEQUENTIAL_KEY_FRAMES,
  MIN_SEQUENTIAL_KEY_FRAMES,
  ProjectType,
  SEQUENTIAL_OPENING_FRAME_VALUES,
  SEQUENTIAL_SHOT_MODE_VALUES,
  SequentialOpeningFrame,
  SequentialShotMode
} from "@schemas/scriptProject";

export const SHEET_RENDER_MODELS = [
  "seedream_5_pro_t2i",
  "gpt_image_2_t2i",
  "nanobanana_2_t2i"
] as const;

export type SheetRenderModel = (typeof SHEET_RENDER_MODELS)[number];

export const DEFAULT_SHEET_RENDER_MODEL: SheetRenderModel = "gpt_image_2_t2i";

/** Desktop-only sheet models. Kept outside SHEET_RENDER_MODELS so the vanilla
 * cloud build never offers a local ComfyUI model to web users. */
export const LOCAL_SHEET_RENDER_MODELS = [
  "qwen_image_2512_local",
  "flux2_klein_4b_q8_local",
  "flux2_klein_9b_q8_local"
] as const;

export type LocalSheetRenderModel = (typeof LOCAL_SHEET_RENDER_MODELS)[number];

export type AnySheetRenderModel = SheetRenderModel | LocalSheetRenderModel;

export const LOCAL_SHEET_RENDER_MODEL: LocalSheetRenderModel =
  "qwen_image_2512_local";

export const isLocalSheetRenderModel = (
  value: unknown
): value is LocalSheetRenderModel =>
  typeof value === "string" &&
  LOCAL_SHEET_RENDER_MODELS.includes(value as LocalSheetRenderModel);

export const resolveLocalSheetRenderModel = (
  value: unknown
): LocalSheetRenderModel =>
  isLocalSheetRenderModel(value) ? value : LOCAL_SHEET_RENDER_MODEL;

export const DEFAULT_SHEET_IMAGE_FILE_TYPE = "png";

export const SCRIPT_PROJECT_RENDER_MODE = RenderMode.CREDITS;

export const SCRIPT_TO_SHOTS_PROJECT_TYPE: ProjectType = "script_to_shots";

export const MINIMAX_H3_MAX_SHOT_RENDER_ENGINE = "minimax_h3_max";

export const SHOT_RENDER_ENGINES = [
  VideoEngine.minimax_reference,
  MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
  VideoEngine.seedance_2_5
] as const;

export type ShotRenderEngine = (typeof SHOT_RENDER_ENGINES)[number];

export const SELECTABLE_SHOT_RENDER_ENGINES = [
  MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
  VideoEngine.seedance_2_5
] as const satisfies readonly ShotRenderEngine[];

export type SelectableShotRenderEngine =
  (typeof SELECTABLE_SHOT_RENDER_ENGINES)[number];

export const UNRECORDED_RENDER_SHOT_RENDER_ENGINE: ShotRenderEngine =
  VideoEngine.minimax_reference;

export const NEW_PROJECT_SHOT_RENDER_ENGINE: SelectableShotRenderEngine =
  MINIMAX_H3_MAX_SHOT_RENDER_ENGINE;

export const SHOT_RENDER_SPEED_LABEL_KEY_BY_ENGINE: Record<
  ShotRenderEngine,
  string
> = {
  [VideoEngine.minimax_reference]:
    "script_project.shot_render_speed_slow.label",
  [MINIMAX_H3_MAX_SHOT_RENDER_ENGINE]:
    "script_project.shot_render_speed_fast.label",
  [VideoEngine.seedance_2_5]: "script_project.shot_render_seedance_2_5.label"
};

export const STORYBOARD_SHEET_NAME = "Storyboard";

export const STORYBOARD_IMAGE_SIZE = { width: 1536, height: 864 } as const;

export const STORYBOARD_GRID_SPACING_PX = {
  sheetMargin: 40,
  gutter: 32,
  numberBand: 52
} as const;

export const STORYBOARD_RENDER_QUALITY = "medium";

export const STORYBOARD_DEFAULT_STYLE_PROMPT =
  "A deliberately crude film storyboard sheet, like a director's thumbnails drawn in under a minute with a thick black marker on plain white paper. Each panel uses only a few dozen loose strokes: figures are blocky gesture shapes or stick figures with blank oval heads, props are simple outlines, backgrounds are a horizon line and one or two shapes. Leave out every small detail: no armour plates, buttons, faces, windows, textures or patterns. No shading, no hatching, no clean or finished linework, no colour.";

export const STORYBOARD_REFERENCE_DESCRIPTION =
  "A rough pencil storyboard sheet for this clip, not something that appears in it. Panel k shows the composition of [Shot k]: follow its framing, subject placement, eye level and camera direction. Never show the drawing itself, its panels, borders, numbers, arrows or pencil style in the video. Who the characters are comes from the character references, not from the sketch.";

export const DEFAULT_SCENE_SHOT_CAMERA_MOVEMENT = "Static";

export const DEFAULT_SCENE_SHOT_FRAMING = "Medium close-up";

export const DEFAULT_SCRIPT_MAX_SHOTS = 30;

export const MIN_SCRIPT_MAX_SHOTS = 1;

export const MAX_SCRIPT_MAX_SHOTS = 200;

export const SCRIPT_PROJECT_ASPECT_RATIOS = [
  { id: "16:9", widthUnits: 16, heightUnits: 9 },
  { id: "9:16", widthUnits: 9, heightUnits: 16 },
  { id: "4:3", widthUnits: 4, heightUnits: 3 },
  { id: "3:4", widthUnits: 3, heightUnits: 4 },
  { id: "1:1", widthUnits: 1, heightUnits: 1 }
] as const;

export type ScriptProjectAspectRatioId =
  (typeof SCRIPT_PROJECT_ASPECT_RATIOS)[number]["id"];

/** The SHORT edge, which is what "768p" names for landscape and portrait alike. */
export const SCRIPT_PROJECT_RESOLUTIONS = [
  { id: "480p", shortEdgePx: 480 },
  { id: "720p", shortEdgePx: 720 },
  { id: "768p", shortEdgePx: 768 },
  { id: "1080p", shortEdgePx: 1080 }
] as const;

export type ScriptProjectResolutionId =
  (typeof SCRIPT_PROJECT_RESOLUTIONS)[number]["id"];

export const DEFAULT_ASPECT_RATIO_ID: ScriptProjectAspectRatioId = "9:16";

export const DEFAULT_RESOLUTION_ID: ScriptProjectResolutionId = "720p";

export const SHEET_RESOLUTIONS = ["1m", "2m"] as const;
export type SheetResolution = (typeof SHEET_RESOLUTIONS)[number];

export const SHEET_RESOLUTION_LABEL_KEY_BY_RESOLUTION: Record<
  SheetResolution,
  string
> = {
  "1m": "script_project.sheet_resolution_1m.label",
  "2m": "script_project.sheet_resolution_2m.label"
};

export const SHOT_DURATION_BOUNDS_SECONDS = { minSeconds: 5, maxSeconds: 15 };

export const MINIMUM_SCENE_SHOT_DURATION_SECONDS = 1;

export const getShotDurationBounds = (shotEngine?: ShotRenderEngine) =>
  shotEngine === VideoEngine.seedance_2_5
    ? { minSeconds: 4, maxSeconds: 30 }
    : SHOT_DURATION_BOUNDS_SECONDS;

export const SHOT_DURATION_OPTIONS = [
  { seconds: 5 },
  { seconds: 6 },
  { seconds: 8 },
  { seconds: 10 }
] as const;

/** BREAKING: 3s → 6s. */
export const DEFAULT_SHOT_DURATION_SECONDS = SHOT_DURATION_OPTIONS[1].seconds;

/** Extra attempts the backend makes when a render fails its quality gate. Its own default is 2,
 * so a shot renders up to three times and bills three times unless we say otherwise. */
const SHOT_RETRY_OPTIONS = [
  { retries: 0 },
  { retries: 1 },
  { retries: 2 },
  { retries: 3 }
] as const;

export const DEFAULT_SHOT_RETRIES = SHOT_RETRY_OPTIONS[0].retries;

export const LOCAL_H3_FAST_STEPS = 3;
export const LOCAL_H3_BASELINE_STEPS = 4;
export const LOCAL_H3_QUALITY_STEPS = 8;

export const LOCAL_H3_STEP_OPTIONS = [
  LOCAL_H3_FAST_STEPS,
  LOCAL_H3_BASELINE_STEPS,
  LOCAL_H3_QUALITY_STEPS
] as const;

export type LocalH3Steps = (typeof LOCAL_H3_STEP_OPTIONS)[number];

/** The supplied FastH3 workflow is the four-step reference baseline. */
export const DEFAULT_LOCAL_H3_STEPS: LocalH3Steps = LOCAL_H3_BASELINE_STEPS;

export const DEFAULT_LOCAL_H3_LEGACY_WORKFLOW = false;

export const LOCAL_H3_TEXT_ENCODER_OPTIONS = ["heretic", "vanilla"] as const;

export type LocalH3TextEncoder = (typeof LOCAL_H3_TEXT_ENCODER_OPTIONS)[number];

export const DEFAULT_LOCAL_H3_TEXT_ENCODER: LocalH3TextEncoder = "vanilla";

export const LOCAL_H3_MODEL_OPTIONS = ["base", "singularity"] as const;

export type LocalH3Model = (typeof LOCAL_H3_MODEL_OPTIONS)[number];

export const DEFAULT_LOCAL_H3_MODEL: LocalH3Model = "base";

/** The one `skipped[].reason` that means "wait", not "nothing to do". A sheet or shot whose
 * exact spec a live plan is already rendering is held until that version lands. */
export const SKIP_REASON_RENDER_IN_PROGRESS = "render already in progress";

export const SKIP_REASON_DROPPED = "dropped";

export const SKIP_REASON_HIDDEN = "hidden";

export const SHOT_DRAG_ITEM_TYPE = "application/x-mago-shot-timeline-id";

export const SKIP_REASON_USER_IMAGE_PINNED = "user-supplied image pinned";

export const PLAN_STEPS_POLL_INTERVAL_MS = 5000;

export const MAX_PROJECT_VISUAL_STYLE_LENGTH = 8000;

export const SCRIPT_PROJECT_TAB_IDS = {
  script: "script",
  assets: "assets",
  storyboard: "storyboard",
  shots: "shots",
  post: "post",
  timeline: "timeline"
} as const;

export type ScriptProjectTabId =
  (typeof SCRIPT_PROJECT_TAB_IDS)[keyof typeof SCRIPT_PROJECT_TAB_IDS];

export const DEFAULT_SCRIPT_PROJECT_TAB_ID: ScriptProjectTabId =
  SCRIPT_PROJECT_TAB_IDS.script;

export const SCRIPT_PROJECT_TAB_PARAM_KEY = "tab";

export const SEQUENTIAL_SHOT_MODES = SEQUENTIAL_SHOT_MODE_VALUES;

export const DEFAULT_SEQUENTIAL_SHOT_MODE: SequentialShotMode = "last_frame";

export const SEQUENTIAL_CONTINUATION_OFF = "off";

export const SEQUENTIAL_OPENING_FRAMES = SEQUENTIAL_OPENING_FRAME_VALUES;

export const DEFAULT_SEQUENTIAL_OPENING_FRAME: SequentialOpeningFrame = "cut";

export { MAX_SEQUENTIAL_KEY_FRAMES, MIN_SEQUENTIAL_KEY_FRAMES };

export const DEFAULT_SEQUENTIAL_KEY_FRAMES = MIN_SEQUENTIAL_KEY_FRAMES;

export const SHOT_INDEX_PAD_LENGTH = 2;

export const SHOT_HEADING_MAX_LENGTH = 200;
