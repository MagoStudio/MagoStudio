/**
 * Which version of a shot the cut carries, as on the cloud. A local cut shot stores the pin itself
 * (`pinned_asset_id`) next to what the cut plays (`asset_id`, `url`, ...),
 * so the second is rebuilt from the first whenever either can change.
 */

type JsonRecord = Record<string, unknown>;

const records = (value: unknown): JsonRecord[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is JsonRecord =>
          !!item && typeof item === "object" && !Array.isArray(item)
      )
    : [];

/** Its pin, else its newest finished render. */
export const shotPin = (cutShot: JsonRecord | undefined): string | null => {
  if (!cutShot) return null;
  const versions = records(cutShot.versions);
  // A cut written before pins were stored apart carries only asset_id.
  const pinned =
    "pinned_asset_id" in cutShot ? cutShot.pinned_asset_id : cutShot.asset_id;
  if (
    typeof pinned === "string" &&
    versions.some((version) => version.asset_id === pinned)
  )
    return pinned;
  const ready = versions.filter((version) => version.ready === true);
  const newest = ready[ready.length - 1]?.asset_id;
  return typeof newest === "string" ? newest : null;
};

/** Rebuilds what the cut plays for this shot from its pin, in place. */
export const resolveCutShot = (cutShot: JsonRecord): JsonRecord => {
  const assetId = shotPin(cutShot);
  const chosen = records(cutShot.versions).find(
    (version) => version.asset_id === assetId
  );
  cutShot.asset_id = assetId;
  cutShot.version_name = chosen?.name ?? null;
  cutShot.is_upscale = !!chosen?.upscale_of;
  cutShot.url = chosen?.url ?? null;
  cutShot.poster_url = chosen?.poster_url ?? null;
  return cutShot;
};

/** The cloud's pin refusals, or null when the pin can be set. */
export const shotPinError = (
  cutShot: JsonRecord | undefined,
  assetId: string | null
): string | null => {
  if (assetId === null) return null;
  const match = records(cutShot?.versions).find(
    (version) => version.asset_id === assetId
  );
  if (!match) return "asset_id is not one of this shot's versions";
  if (match.ready !== true)
    return "asset_id belongs to a render that has not completed";
  return null;
};
