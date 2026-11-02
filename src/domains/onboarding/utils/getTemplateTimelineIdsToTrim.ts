import { TimelineRef } from "./templateTimelineTypes";

export const getTemplateTimelineIdsToTrim = (
  timelines: TimelineRef[],
  selectedTimelineId: string
): string[] =>
  timelines
    .filter((candidate) => candidate.id !== selectedTimelineId)
    .map((candidate) => candidate.id);
