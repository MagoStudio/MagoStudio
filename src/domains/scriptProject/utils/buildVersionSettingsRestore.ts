import {
  CutShotVersion,
  ShotDialogueTurn,
  ShotDialogueTurnSchema,
  SequentialShotConfigSchema,
  ShotTags
} from "@schemas/scriptProject";

import { SHOT_FPS } from "./snapShotFrames";

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

/** Restore editable shot fields from the backend's frozen render spec. */
export const buildVersionSettingsRestore = (
  version: CutShotVersion,
  tokenByAssetId: ReadonlyMap<string, string>
) => {
  const inputs = record(version.input_settings);
  const spec =
    record(version.render_spec) ?? record(inputs?._local_render_spec) ?? inputs;
  if (!spec) return null;
  const result: {
    videoPrompt?: string | null;
    dialogue?: ShotDialogueTurn[];
    durationSeconds?: number;
    tags?: ShotTags;
    sequential?: ReturnType<typeof SequentialShotConfigSchema.parse> | null;
  } = {};
  if (typeof spec.video_prompt === "string" || spec.video_prompt === null)
    result.videoPrompt = spec.video_prompt;
  if (spec.dialogue !== undefined || spec.kind === "shot") {
    const parsed = ShotDialogueTurnSchema.array().safeParse(
      spec.dialogue ?? []
    );
    if (!parsed.success) return null;
    result.dialogue = parsed.data;
  }
  const durationFrom = (source: Record<string, unknown> | null) => {
    const settings = record(source?.settings) ?? source;
    const range = settings?.frame_range;
    const value =
      typeof settings?.duration_s === "number"
        ? settings.duration_s
        : Array.isArray(range) &&
            typeof range[0] === "number" &&
            typeof range[1] === "number"
          ? (range[1] - range[0] + 1) / SHOT_FPS
          : null;
    return value !== null && Number.isFinite(value) && value > 0 ? value : null;
  };
  const duration = durationFrom(spec) ?? durationFrom(inputs);
  if (duration !== null && Number.isFinite(duration) && duration > 0)
    result.durationSeconds = duration;
  const references = record(spec.references);
  if (references) {
    const tags: ShotTags = { characters: [], environments: [], props: [] };
    for (const category of ["characters", "environments", "props"] as const) {
      const ids = references[category] ?? [];
      if (!Array.isArray(ids)) return null;
      for (const id of ids) {
        const token =
          typeof id === "string" ? tokenByAssetId.get(id) : undefined;
        // Missing/disabled references cannot be sent to the backend as valid tags.
        if (!token) return null;
        tags[category].push(token);
      }
    }
    result.tags = tags;
  }
  if (spec.sequential !== undefined) {
    const parsed = SequentialShotConfigSchema.safeParse(spec.sequential);
    if (parsed.success) result.sequential = parsed.data;
  } else if (spec.kind === "shot") {
    result.sequential = null;
  }
  return Object.keys(result).length ? result : null;
};
