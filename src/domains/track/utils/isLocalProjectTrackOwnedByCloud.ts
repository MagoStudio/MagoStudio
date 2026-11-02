type LocalProjectRead = Record<string, unknown> & { origin?: string };

const asRecords = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object"
      )
    : [];

export const isLocalProjectTrackOwnedByCloud = (
  localProject: LocalProjectRead | null | undefined,
  trackId: string
): boolean => {
  if (localProject?.origin !== "cloud") return false;
  const localTrack = asRecords(localProject.timelines)
    .flatMap((timeline) => asRecords(timeline.layers))
    .find((layer) => layer.id === trackId);
  const isLocalOnlyTrackOfCloudProject = localTrack?.cloud_mirrored === false;
  return !isLocalOnlyTrackOfCloudProject;
};
