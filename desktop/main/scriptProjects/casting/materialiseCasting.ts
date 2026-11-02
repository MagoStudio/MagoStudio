import { randomUUID } from "node:crypto";

import { pythonRound, textOf } from "../../vlm/dialogue";

import {
  buildBreakdown,
  normalizeCasting,
  type BreakdownShot
} from "./scenarioShots";
import {
  DEFAULT_ENGINE,
  formatG,
  packedBreakdownShots,
  type PackedShot
} from "./sequenceGeneration";

/**
 * Casting -> a local project's editable state: the backend's materialise step (and the shot/key
 * upserts it calls), written against the local snapshot instead of timelines
 * and layers. The snapshot's `keys`/`shots` are the shape the backend's
 * project-state read serves, so the rules are the backend's:
 *
 * - a key is created once and only ever re-enabled after that — its prompt and
 *   description are the user's edits, and a re-cast must not discard them;
 * - an entity the script no longer uses is disabled, never deleted;
 * - a shot is matched on its `key` and updated in place, keeping the fields
 *   the user edited; a shot the cast no longer contains is flagged `dropped`
 *   (kept for its renders, left out of the cut), never deleted.
 */

type JsonRecord = Record<string, unknown>;
type CastShot = BreakdownShot | PackedShot;

const DEFAULT_MAX_SHOTS = 30;
const FIRST_SHEET_LAYER_ORDER = 10000;
/** The backend truncates a layer name to this. */
const MAX_LAYER_NAME_LENGTH = 200;

const SHOT_EDITABLE_FIELDS = [
  "video_prompt",
  "dialogue",
  "tags",
  "duration_s"
] as const;

/** Set once the user renames a shot. */
export const HEADING_EDITED_KEY = "heading_edited";
/** The length warning's floor: a short film absorbs this much overshoot. */
const LENGTH_WARNING_MIN_TOLERANCE_S = 6.0;
/** The length warning's share of the render length a long film absorbs. */
const LENGTH_WARNING_TOLERANCE_RATIO = 0.1;

/** The engines a script project may pack for. */
export const SHOT_ENGINES = ["v9.1.0", "minimax_h3_max"] as const;

const records = (value: unknown): JsonRecord[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is JsonRecord =>
          !!item && typeof item === "object" && !Array.isArray(item)
      )
    : [];

/** Always a string, falling back to the sequence id. */
export const shotKey = (shot: JsonRecord): string | null => {
  const key = shot.key ?? shot.sequence_id;
  return key === null || key === undefined ? null : textOf(key);
};

/** Stringified, skipping unidentifiable shots. */
const summaryShotKeys = (keys: unknown[]): string[] =>
  keys.filter((key) => key !== null && key !== undefined).map(textOf);

/** Field-level edits, or the coarse `edited` flag's set. */
const editedShotFields = (shot: JsonRecord): Set<string> => {
  if ("edited_fields" in shot)
    return new Set(
      Array.isArray(shot.edited_fields) ? shot.edited_fields.map(textOf) : []
    );
  return shot.edited
    ? new Set(["video_prompt", "tags", "duration_s"])
    : new Set();
};

/** What a cast writes onto a shot. */
const shotSettings = (shot: CastShot, scriptVersion: number): JsonRecord => {
  const dialogue = records(shot.dialogue).map((turn) => ({ ...turn }));
  return {
    shot_index: shot.index,
    key: shot.key ?? null,
    sequence_id: shot.sequence_id ?? null,
    heading: shot.heading ?? null,
    action: shot.action ?? null,
    video_prompt: shot.video_prompt ?? null,
    dialogue,
    cast_dialogue: dialogue.map((turn) => ({ ...turn })),
    tags: {
      characters: [...(shot.character_tokens ?? [])],
      environments: [...(shot.environment_tokens ?? [])],
      props: [...(shot.prop_tokens ?? [])]
    },
    script_version: scriptVersion,
    atomic_duration_s: shot.duration_short_s ?? null,
    duration_s: shot.duration_short_s ?? null
  };
};

/**
 * Each heading led by its shot number,
 * `N` per sequence in cast order and `N.M` within a sequence of several shots.
 */
export const numberedHeadings = <
  Shot extends { sequence_id?: unknown; heading?: unknown }
>(
  shots: Shot[]
): Shot[] => {
  const groups = shots.map((shot) =>
    shot.sequence_id !== null && shot.sequence_id !== undefined
      ? shot.sequence_id
      : Symbol("unsequenced")
  );
  const groupSizes = new Map<unknown, number>();
  for (const group of groups)
    groupSizes.set(group, (groupSizes.get(group) ?? 0) + 1);
  const groupNumbers = new Map(
    [...groupSizes.keys()].map((group, position) => [group, position + 1])
  );
  const seenInGroup = new Map<unknown, number>();
  return shots.map((shot, position) => {
    const group = groups[position];
    const seen = (seenInGroup.get(group) ?? 0) + 1;
    seenInGroup.set(group, seen);
    const groupNumber = String(groupNumbers.get(group));
    const number =
      (groupSizes.get(group) ?? 0) > 1 ? `${groupNumber}.${seen}` : groupNumber;
    const castHeading = typeof shot.heading === "string" ? shot.heading : "";
    return { ...shot, heading: `${number} ${castHeading.trim()}`.trim() };
  });
};

/** `[seconds, null]`, `[null, null]` when absent, or `[null, message]`. */
export const parseTargetDurationS = (
  value: unknown
): [number | null, string | null] => {
  if (value === null || value === undefined) return [null, null];
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
    return [null, "target_duration_s must be a positive number"];
  return [value, null];
};

/** Set only when the plan overshoots the target past tolerance. */
export const lengthWarning = (
  plannedTotalS: number | null,
  targetDurationS: number | null | undefined
): string | null => {
  if (!targetDurationS || plannedTotalS === null) return null;
  const overshoot = plannedTotalS - targetDurationS;
  const tolerance = Math.max(
    LENGTH_WARNING_MIN_TOLERANCE_S,
    LENGTH_WARNING_TOLERANCE_RATIO * plannedTotalS
  );
  if (overshoot <= tolerance) return null;
  return (
    `planned ${formatG(plannedTotalS)}s is ${formatG(pythonRound(overshoot, 2))}s over the ` +
    `${formatG(targetDurationS)}s target; shorten or merge shots, or raise the target`
  );
};

export type MaterialisedCasting = {
  state: JsonRecord;
  summary: {
    keys_added: string[];
    keys_kept: string[];
    keys_unused: string[];
    shots_added: string[];
    shots_kept: string[];
    shots_dropped: string[];
    dropped_entities: JsonRecord[];
    sequence_warnings: Array<{ key: unknown; warnings: string[] }>;
    planned_total_s: number | null;
    target_duration_s: number | null;
    length_warning: string | null;
  };
};

/**
 * The backend's materialise step against the previous snapshot state. Pure: the
 * caller persists the state (after resolving references) and renames the
 * project from `casting.title`.
 */
export const materialiseCasting = (input: {
  previousState: JsonRecord | null | undefined;
  casting: JsonRecord;
  maxShots?: number;
  scriptVersion?: number;
  renderSequences?: boolean;
  engine?: string | null;
  targetDurationS?: number | null;
}): MaterialisedCasting => {
  const maxShots = input.maxShots ?? DEFAULT_MAX_SHOTS;
  const scriptVersion = input.scriptVersion ?? 1;
  const normalized = normalizeCasting(input.casting);
  const breakdown = buildBreakdown(normalized, maxShots);
  const targetDurationS = input.targetDurationS ?? null;
  let shots: CastShot[] = breakdown.shots;
  let sequenceWarnings: Array<{ key: unknown; warnings: string[] }> = [];
  let plannedTotalS: number | null = null;
  if (input.renderSequences && !normalized.shots.length) {
    sequenceWarnings = [
      {
        key: null,
        warnings: [
          "this casting carries no atomic shots[], so there were no beats to pack and the " +
            "scenes were materialised unpacked"
        ]
      }
    ];
  } else if (input.renderSequences) {
    [shots, sequenceWarnings, plannedTotalS] = packedBreakdownShots(
      breakdown.shots,
      input.engine || DEFAULT_ENGINE,
      targetDurationS
    );
  }
  shots = numberedHeadings(shots);

  const previousState = input.previousState ?? {};

  // --- keys ------------------------------------------------------------------
  const previousKeys = records(previousState.keys);
  const keysByToken = new Map(
    previousKeys.map((key) => [textOf(key.token), { ...key }])
  );
  // One past the highest, 10000 when none.
  const nextOrder = previousKeys.length
    ? Math.max(...previousKeys.map((key) => Number(key.layer_order) || 0)) + 1
    : FIRST_SHEET_LAYER_ORDER;
  const keysAdded: string[] = [];
  const keysKept: string[] = [];
  Object.entries(breakdown.sheets)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .forEach(([token, entity], order) => {
      const existing = keysByToken.get(token);
      if (existing) {
        existing.enabled = true;
        for (const field of ["body_plan", "distinctive_features"]) {
          if (!(field in existing) && entity[field])
            existing[field] = entity[field];
        }
        keysKept.push(token);
        return;
      }
      keysByToken.set(token, {
        token,
        name: (textOf(entity.name) || token).slice(0, MAX_LAYER_NAME_LENGTH),
        kind: entity.kind ?? null,
        ...Object.fromEntries(
          ["body_plan", "distinctive_features"]
            .filter((field) => entity[field])
            .map((field) => [field, entity[field]])
        ),
        description: entity.description ?? null,
        seed_description: entity.description ?? null,
        prompt: entity.t2i_prompt ?? null,
        enabled: true,
        layer_id: randomUUID(),
        layer_order: nextOrder + order,
        selected_asset_id: null,
        effective_asset_id: null,
        effective_source: null,
        images: []
      });
      keysAdded.push(token);
    });
  const keysUnused: string[] = [];
  for (const [token, key] of keysByToken) {
    if (key.role === "storyboard") continue;
    if (keysKept.includes(token) || keysAdded.includes(token)) continue;
    key.enabled = false;
    keysUnused.push(token);
  }

  // --- shots -----------------------------------------------------------------
  const previousShots = records(previousState.shots).map((shot) => ({
    ...shot
  }));
  const byKey = new Map<string | null, JsonRecord>();
  for (const shot of previousShots) byKey.set(shotKey(shot), shot);
  const shotsAdded: unknown[] = [];
  const shotsKept: unknown[] = [];
  const created: JsonRecord[] = [];
  for (const shot of shots) {
    const settings = shotSettings(shot, scriptVersion);
    const key =
      shot.key === null || shot.key === undefined ? null : textOf(shot.key);
    const existing = byKey.get(key);
    if (existing) {
      const edited = editedShotFields(existing);
      for (const field of SHOT_EDITABLE_FIELDS) {
        if (edited.has(field))
          settings[field] = existing[field] ?? settings[field];
      }
      if (existing[HEADING_EDITED_KEY])
        settings.heading = existing.heading ?? null;
      settings.edited = existing.edited ?? false;
      if ("edited_fields" in existing)
        settings.edited_fields = [...edited].sort();
      Object.assign(existing, settings);
      shotsKept.push(shot.key);
      continue;
    }
    created.push({
      timeline_id: randomUUID(),
      ...settings,
      dropped: false,
      sequential: null,
      prompt_rewrite: null,
      locked: false
    });
    shotsAdded.push(shot.key);
  }
  const keptKeys = new Set(shotsKept.map((key) => textOf(key)));
  const shotsDropped: string[] = [];
  for (const [key, shot] of byKey) {
    const dropped = !keptKeys.has(textOf(key));
    shot.dropped = dropped;
    if (dropped && key !== null) shotsDropped.push(key);
  }

  // Timeline order: by shot_index, then the order the timelines were
  // made in — so an existing shot comes before a new one at the same index.
  const ordered = [...previousShots, ...created]
    .map((shot, position) => ({ shot, position }))
    .sort(
      (left, right) =>
        Number(left.shot.shot_index ?? 0) -
          Number(right.shot.shot_index ?? 0) || left.position - right.position
    )
    .map(({ shot }) => shot);

  return {
    state: {
      ...previousState,
      keys: [...keysByToken.values()],
      shots: ordered
    },
    summary: {
      keys_added: keysAdded,
      keys_kept: [...keysKept].sort(),
      keys_unused: [...keysUnused].sort(),
      shots_added: summaryShotKeys(shotsAdded),
      shots_kept: summaryShotKeys(shotsKept),
      shots_dropped: [...shotsDropped].sort(),
      dropped_entities: breakdown.dropped,
      sequence_warnings: sequenceWarnings,
      planned_total_s: plannedTotalS,
      target_duration_s: targetDurationS,
      length_warning: lengthWarning(plannedTotalS, targetDurationS)
    }
  };
};
