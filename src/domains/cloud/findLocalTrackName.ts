interface TreeLayer {
  id?: unknown;
  name?: unknown;
}

interface TreeTimeline {
  layers?: unknown;
}

interface TreeProject {
  timelines?: unknown;
}

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

export const findLocalTrackName = (
  projects: unknown,
  trackId: string
): string | null => {
  for (const project of asArray(projects) as TreeProject[]) {
    for (const timeline of asArray(project?.timelines) as TreeTimeline[]) {
      for (const layer of asArray(timeline?.layers) as TreeLayer[]) {
        if (layer?.id !== trackId) continue;
        return typeof layer.name === "string" && layer.name ? layer.name : null;
      }
    }
  }
  return null;
};
