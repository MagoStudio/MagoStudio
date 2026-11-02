type Sources = {
  renderingShotTimelineIdsFromRun: Iterable<string>;
  inProgressShotTimelineIds: Iterable<string>;
  failedShotTimelineIds: ReadonlySet<string>;
};

export const resolveRenderingShotTimelineIds = ({
  renderingShotTimelineIdsFromRun,
  inProgressShotTimelineIds,
  failedShotTimelineIds
}: Sources): Set<string> => {
  const shotTimelineIdsStillRenderingInThisTabsRun = [
    ...renderingShotTimelineIdsFromRun
  ].filter((timelineId) => !failedShotTimelineIds.has(timelineId));
  return new Set([
    ...shotTimelineIdsStillRenderingInThisTabsRun,
    ...inProgressShotTimelineIds
  ]);
};
