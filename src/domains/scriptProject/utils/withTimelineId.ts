export const withTimelineId =
  (timelineId: string, isIncluded: boolean) =>
  (timelineIds: ReadonlySet<string>): ReadonlySet<string> => {
    if (timelineIds.has(timelineId) === isIncluded) return timelineIds;
    const nextTimelineIds = new Set(timelineIds);
    if (isIncluded) nextTimelineIds.add(timelineId);
    else nextTimelineIds.delete(timelineId);
    return nextTimelineIds;
  };
