import { TimelineRef } from "./templateTimelineTypes";

export const resolveTemplateTimelineId = (
  timelines: TimelineRef[],
  shotName: string
): string => {
  const timeline = timelines.find((candidate) => candidate.name === shotName);

  if (!timeline) {
    throw new Error(`No cloned timeline matches template shot "${shotName}"`);
  }

  return timeline.id;
};
