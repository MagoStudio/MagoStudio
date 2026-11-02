import { randomUUID } from "node:crypto";

import { textOf } from "../../vlm/dialogue";

/**
 * Adding, moving and hiding shots as the backend does, on the local
 * snapshot's `state.shots`.
 */

type JsonRecord = Record<string, unknown>;

const MANUAL_SHOT_KEY_PREFIX = "manual-";
const MANUAL_SHOT_KEY_HEX_LENGTH = 12;
export const PREDECESSOR_EDITED_FIELD = "predecessor";
const PREDECESSOR_BASELINE_KEY = "predecessor_baseline";

const isRecord = (value: unknown): value is JsonRecord =>
  !!value && typeof value === "object" && !Array.isArray(value);

export const isShotOutOfCut = (shot: JsonRecord): boolean =>
  !!shot.dropped || !!shot.hidden;

export const shotsInProjectOrder = (shots: JsonRecord[]): JsonRecord[] =>
  [...shots].sort(
    (left, right) => Number(left.shot_index) - Number(right.shot_index)
  );

/** Timeline id -> previous in-cut timeline id. */
export const sequentialPredecessors = (
  orderedShots: JsonRecord[]
): Map<string, string | null> => {
  const predecessors = new Map<string, string | null>();
  let previousInCut: string | null = null;
  for (const shot of orderedShots) {
    predecessors.set(String(shot.timeline_id), previousInCut);
    if (!isShotOutOfCut(shot)) previousInCut = String(shot.timeline_id);
  }
  return predecessors;
};

const editedShotFields = (shot: JsonRecord): Set<string> => {
  if ("edited_fields" in shot)
    return new Set(
      Array.isArray(shot.edited_fields) ? shot.edited_fields.map(textOf) : []
    );
  return shot.edited
    ? new Set(["video_prompt", "tags", "duration_s"])
    : new Set();
};

/** Flags, in place on `orderedShotsAfter`, each sequential shot whose predecessor changed. */
export const flagSequentialPredecessorChanges = (
  predecessorsBefore: Map<string, string | null>,
  orderedShotsAfter: JsonRecord[]
): void => {
  const predecessorsAfter = sequentialPredecessors(orderedShotsAfter);
  for (const shot of orderedShotsAfter) {
    const timelineId = String(shot.timeline_id);
    const isSequential = isRecord(shot.sequential) && !!shot.sequential.enabled;
    const predecessorBefore = predecessorsBefore.get(timelineId) ?? null;
    const predecessorAfter = predecessorsAfter.get(timelineId) ?? null;
    if (!isSequential || predecessorBefore === predecessorAfter) continue;
    const baseline = isRecord(shot[PREDECESSOR_BASELINE_KEY])
      ? shot[PREDECESSOR_BASELINE_KEY]
      : { timeline_id: predecessorBefore, edited: !!shot.edited };
    const editedFields = editedShotFields(shot);
    if (predecessorAfter === (baseline.timeline_id ?? null)) {
      editedFields.delete(PREDECESSOR_EDITED_FIELD);
      delete shot[PREDECESSOR_BASELINE_KEY];
      shot.edited = !!baseline.edited || editedFields.size > 0;
    } else {
      editedFields.add(PREDECESSOR_EDITED_FIELD);
      shot[PREDECESSOR_BASELINE_KEY] = baseline;
      shot.edited = true;
    }
    shot.edited_fields = [...editedFields].sort();
  }
};

/** `shot` at `shotIndex` (clamped), every shot renumbered 0..n-1. */
const reorderShots = (
  orderedShots: JsonRecord[],
  shot: JsonRecord,
  shotIndex: number
): JsonRecord[] => {
  const reordered = orderedShots.filter(
    (candidate) => candidate.timeline_id !== shot.timeline_id
  );
  reordered.splice(Math.min(shotIndex, reordered.length), 0, shot);
  reordered.forEach((candidate, index) => {
    candidate.shot_index = index;
  });
  return reordered;
};

export const shotOrderEntries = (orderedShots: JsonRecord[]): JsonRecord[] =>
  orderedShots.map((shot) => ({
    timeline_id: shot.timeline_id,
    shot_index: shot.shot_index,
    edited: !!shot.edited
  }));

/** The fields `POST /projects/{id}/shots` stores on a hand-added shot. */
export interface ManualShotFields {
  heading?: unknown;
  video_prompt?: unknown;
  dialogue?: unknown;
  tags?: unknown;
  duration_s?: unknown;
}

const createManualShotKey = () =>
  `${MANUAL_SHOT_KEY_PREFIX}${randomUUID().replaceAll("-", "").slice(0, MANUAL_SHOT_KEY_HEX_LENGTH)}`;

/** Returns the new shot; `shots` is re-sorted and renumbered in place. */
export const insertManualShot = ({
  shots,
  fields,
  shotIndex,
  scriptVersion
}: {
  shots: JsonRecord[];
  fields: ManualShotFields;
  shotIndex: number | null;
  scriptVersion: unknown;
}): { shot: JsonRecord; order: JsonRecord[] } => {
  const orderedBefore = shotsInProjectOrder(shots);
  const predecessorsBefore = sequentialPredecessors(orderedBefore);
  const tags = isRecord(fields.tags) ? fields.tags : {};
  const heading =
    (typeof fields.heading === "string" ? fields.heading : "").trim() || null;
  const dialogue = Array.isArray(fields.dialogue)
    ? fields.dialogue.map((turn) => ({ ...(turn as JsonRecord) }))
    : [];
  const shot: JsonRecord = {
    timeline_id: randomUUID(),
    shot_index: orderedBefore.length,
    sequence_id: null,
    key: createManualShotKey(),
    heading,
    action: null,
    video_prompt:
      typeof fields.video_prompt === "string" ? fields.video_prompt : null,
    dialogue,
    cast_dialogue: dialogue.map((turn) => ({ ...turn })),
    tags: {
      characters: Array.isArray(tags.characters) ? [...tags.characters] : [],
      environments: Array.isArray(tags.environments)
        ? [...tags.environments]
        : [],
      props: Array.isArray(tags.props) ? [...tags.props] : []
    },
    atomic_duration_s: null,
    duration_s:
      typeof fields.duration_s === "number" ? fields.duration_s : null,
    dropped: false,
    edited: false,
    manual: true,
    script_version: scriptVersion ?? null
  };
  const orderedAfter = reorderShots(
    orderedBefore,
    shot,
    shotIndex ?? orderedBefore.length
  );
  flagSequentialPredecessorChanges(predecessorsBefore, orderedAfter);
  shots.splice(0, shots.length, ...orderedAfter);
  return { shot, order: shotOrderEntries(orderedAfter) };
};

/** Move and/or hide one shot; `shots` is re-sorted in place. */
export const placeShot = ({
  shots,
  shot,
  shotIndex,
  isShotHidden
}: {
  shots: JsonRecord[];
  shot: JsonRecord;
  shotIndex: number | null;
  isShotHidden: boolean | null;
}): JsonRecord[] => {
  let ordered = shotsInProjectOrder(shots);
  const predecessorsBefore = sequentialPredecessors(ordered);
  if (shotIndex !== null) ordered = reorderShots(ordered, shot, shotIndex);
  if (isShotHidden === true) shot.hidden = true;
  if (isShotHidden === false) delete shot.hidden;
  flagSequentialPredecessorChanges(predecessorsBefore, ordered);
  shots.splice(0, shots.length, ...ordered);
  return shotOrderEntries(ordered);
};
