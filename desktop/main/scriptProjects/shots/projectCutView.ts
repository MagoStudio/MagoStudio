import { shotsInProjectOrder } from "./shotOrder";

/**
 * GET /projects/{id}/cut from the local snapshot, as the backend reads it. The stored cut keeps an
 * entry, with its versions, for every shot not dropped by a re-cast; hidden
 * shots are split out here into `hidden_shots`, so render bookkeeping never
 * has to move an entry between lists.
 */

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  !!value && typeof value === "object" && !Array.isArray(value);
const records = (value: unknown): JsonRecord[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

/** A cut entry for a shot with nothing rendered yet. */
export const emptyCutShotEntry = (shot: JsonRecord): JsonRecord => ({
  timeline_id: shot.timeline_id,
  shot_index: shot.shot_index,
  sequence_id: shot.sequence_id ?? null,
  heading: shot.heading ?? null,
  asset_id: null,
  pinned_asset_id: null,
  version_name: null,
  is_upscale: false,
  url: null,
  poster_url: null,
  versions: []
});

export const buildProjectCutView = ({
  projectId,
  stateShots,
  storedCut
}: {
  projectId: string;
  stateShots: JsonRecord[];
  storedCut: JsonRecord | null | undefined;
}): JsonRecord => {
  const storedEntries = new Map(
    records(storedCut?.shots).map((entry) => [String(entry.timeline_id), entry])
  );
  const shots: JsonRecord[] = [];
  const hiddenShots: JsonRecord[] = [];
  for (const shot of shotsInProjectOrder(stateShots)) {
    if (shot.dropped) continue;
    const entry = {
      ...(storedEntries.get(String(shot.timeline_id)) ??
        emptyCutShotEntry(shot)),
      shot_index: shot.shot_index,
      sequence_id: shot.sequence_id ?? null,
      heading: shot.heading ?? null
    };
    (shot.hidden ? hiddenShots : shots).push(entry);
  }
  const unrendered = shots.filter((entry) => !entry.asset_id);
  return {
    ...(storedCut ?? {}),
    project_id: projectId,
    shots,
    hidden_shots: hiddenShots,
    missing: unrendered.map((entry) => entry.sequence_id ?? null),
    missing_timeline_ids: unrendered.map((entry) => entry.timeline_id),
    export: storedCut?.export ?? null
  };
};
