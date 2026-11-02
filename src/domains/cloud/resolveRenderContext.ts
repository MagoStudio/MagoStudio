/**
 * Works out which local project, shot and source video a render belongs to.
 *
 * `postRender` is handed only two track ids — the output track and the input
 * track — because the cloud web app needs nothing more. The cloud mirror does: it
 * has to name a project and a shot, and know which asset to upload. All of that
 * is already in the local library, so it is derived here rather than threaded
 * through every call site.
 *
 * Pure, so it can be tested against a project tree without a database.
 */

export interface LocalRenderContext {
  projectId: string;
  projectName: string;
  shotId: string;
  shotName: string;
  /** The source video the render reads from. */
  assetId: string;
  assetName: string;
  outputTrackId: string;
}

interface TreeAsset {
  id?: unknown;
  name?: unknown;
  type?: unknown;
}

interface TreeClip {
  asset_id?: unknown;
  asset?: TreeAsset;
}

interface TreeLayer {
  id?: unknown;
  clips?: TreeClip[];
}

interface TreeTimeline {
  id?: unknown;
  name?: unknown;
  layers?: TreeLayer[];
}

interface TreeProject {
  id?: unknown;
  name?: unknown;
  timelines?: TreeTimeline[];
}

const asString = (value: unknown): string | null =>
  typeof value === "string" && value ? value : null;

/** The video asset on a track, if it has one. */
const videoAssetOf = (
  layer: TreeLayer
): { id: string; name: string } | null => {
  const clips = Array.isArray(layer?.clips) ? layer.clips : [];
  for (const clip of clips) {
    if (!clip || typeof clip !== "object") continue;
    const id = asString(clip.asset?.id) ?? asString(clip.asset_id);
    if (!id) continue;
    const type = asString(clip.asset?.type);
    // Skip generated images so a shot with img2img output still resolves to the
    // video that a video render actually reads from.
    if (type && type !== "VIDEO") continue;
    return { id, name: asString(clip.asset?.name) ?? "clip" };
  }
  return null;
};

export const resolveRenderContext = (
  projects: unknown,
  input: { outputTrackId: string; inputTrackId: string }
): LocalRenderContext | null => {
  const tree = Array.isArray(projects) ? (projects as TreeProject[]) : [];

  for (const project of tree) {
    if (!project || typeof project !== "object") continue;
    const projectId = asString(project.id);
    if (!projectId) continue;
    const timelines = Array.isArray(project.timelines) ? project.timelines : [];

    for (const timeline of timelines) {
      if (!timeline || typeof timeline !== "object") continue;
      const shotId = asString(timeline.id);
      if (!shotId) continue;
      const layers = Array.isArray(timeline.layers) ? timeline.layers : [];

      const holdsOutput = layers.some(
        (layer) => asString(layer?.id) === input.outputTrackId
      );
      if (!holdsOutput) continue;

      // Prefer the named input track, but fall back whenever it yields no video
      // -- including when it exists and holds only generated images -- since a
      // shot always renders from its own source.
      const named = layers.find(
        (layer) => asString(layer?.id) === input.inputTrackId
      );
      const asset =
        (named ? videoAssetOf(named) : null) ??
        layers
          .map((layer) => (layer ? videoAssetOf(layer) : null))
          .find((candidate) => candidate !== null) ??
        null;
      if (!asset) return null;

      return {
        projectId,
        projectName: asString(project.name) ?? "Untitled",
        shotId,
        shotName: asString(timeline.name) ?? "Shot",
        assetId: asset.id,
        assetName: asset.name,
        outputTrackId: input.outputTrackId
      };
    }
  }
  return null;
};
