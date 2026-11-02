import { PlanStep } from "@schemas/plan";

import { TERMINAL_STEP_STATUSES } from "./planStatuses";

const PERCENT_TOTAL = 100;

export interface TimelineProgress {
  completedTimelines: number;
  totalTimelines: number;
  completionPercent: number;
}

export function computeTimelineProgress(steps: PlanStep[]): TimelineProgress {
  const groups = new Map<string, PlanStep[]>();
  for (const step of steps) {
    const tid = step.timeline_id ?? step.project_id ?? "unknown";
    const arr = groups.get(tid) ?? [];
    arr.push(step);
    groups.set(tid, arr);
  }
  const totalTimelines = groups.size;
  let completedTimelines = 0;
  for (const timelineSteps of groups.values()) {
    if (timelineSteps.every((s) => TERMINAL_STEP_STATUSES.has(s.status))) {
      completedTimelines++;
    }
  }
  const completionPercent =
    totalTimelines > 0
      ? (completedTimelines / totalTimelines) * PERCENT_TOTAL
      : 0;
  return { completedTimelines, totalTimelines, completionPercent };
}

const STEPS_PER_TIMELINE = 6;

export function estimateTimelineProgressFromCounts(
  totalSteps: number,
  completedSteps: number
): TimelineProgress {
  const totalTimelines = Math.max(
    1,
    Math.round(totalSteps / STEPS_PER_TIMELINE)
  );
  const completedTimelines = Math.floor(completedSteps / STEPS_PER_TIMELINE);
  const completionPercent =
    totalTimelines > 0
      ? (completedTimelines / totalTimelines) * PERCENT_TOTAL
      : 0;
  return { completedTimelines, totalTimelines, completionPercent };
}
