export interface LocalImageToVideoRenderContext {
  projectId: string;
  projectName: string;
  shotId: string;
  shotName: string;
  outputTrackId: string;
}

interface TreeLayer {
  id?: unknown;
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

const asNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value ? value : null;

const asArray = <T>(value: T[] | undefined): T[] =>
  Array.isArray(value) ? value : [];

const doesTimelineHoldTrack = (timeline: TreeTimeline, trackId: string) =>
  asArray(timeline.layers).some(
    (layer) => asNonEmptyString(layer?.id) === trackId
  );

export const resolveImageToVideoRenderContext = (
  projects: unknown,
  input: { outputTrackId: string }
): LocalImageToVideoRenderContext | null => {
  const projectTree = Array.isArray(projects)
    ? (projects as TreeProject[])
    : [];

  for (const project of projectTree) {
    const projectId = asNonEmptyString(project?.id);
    if (!projectId) continue;

    const containerShot = asArray(project.timelines).find(
      (timeline) =>
        asNonEmptyString(timeline?.id) !== null &&
        doesTimelineHoldTrack(timeline, input.outputTrackId)
    );
    if (!containerShot) continue;

    return {
      projectId,
      projectName: asNonEmptyString(project.name) ?? "Untitled",
      shotId: containerShot.id as string,
      shotName: asNonEmptyString(containerShot.name) ?? "Shot",
      outputTrackId: input.outputTrackId
    };
  }
  return null;
};
