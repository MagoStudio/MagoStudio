type JsonRecord = Record<string, unknown>;

const UNFINISHED_STEP_STATUSES = ["PENDING", "RUNNING", "FAILED"];

const previousTimelineIdOf = (step: JsonRecord): string | undefined => {
  if (step.tool_name !== "poll_prev_shot_complete") return undefined;
  const toolArgs = step.tool_args;
  if (!toolArgs || typeof toolArgs !== "object") return undefined;
  const previousTimelineId = (toolArgs as JsonRecord).prev_timeline_id;
  return typeof previousTimelineId === "string"
    ? previousTimelineId
    : undefined;
};

export const withUnfinishedSequentialDependents = ({
  planSteps,
  supersededTimelineIds
}: {
  planSteps: JsonRecord[];
  supersededTimelineIds: Set<string>;
}): Set<string> => {
  const timelineIdsWithUnfinishedSteps = new Set(
    planSteps
      .filter((step) => UNFINISHED_STEP_STATUSES.includes(String(step.status)))
      .map((step) => String(step.timeline_id))
  );
  const expandedTimelineIds = new Set(supersededTimelineIds);
  let isExpansionGrowing = true;
  while (isExpansionGrowing) {
    isExpansionGrowing = false;
    for (const step of planSteps) {
      const dependentTimelineId = String(step.timeline_id);
      const previousTimelineId = previousTimelineIdOf(step);
      const isUnfinishedDependentOfSupersededShot =
        !!previousTimelineId &&
        expandedTimelineIds.has(previousTimelineId) &&
        timelineIdsWithUnfinishedSteps.has(dependentTimelineId) &&
        !expandedTimelineIds.has(dependentTimelineId);
      if (!isUnfinishedDependentOfSupersededShot) continue;
      expandedTimelineIds.add(dependentTimelineId);
      isExpansionGrowing = true;
    }
  }
  return expandedTimelineIds;
};
