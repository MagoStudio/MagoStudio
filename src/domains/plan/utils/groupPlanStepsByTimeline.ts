import { PlanStep } from "@schemas/plan";

import { PlanGlyphColor, TERMINAL_STEP_STATUSES } from "./planStatuses";

export type TimelineSummaryKind = "running" | "failed" | "done" | "pending";

export const TIMELINE_SUMMARY_COLOR_MAP: Record<
  TimelineSummaryKind,
  PlanGlyphColor
> = {
  running: "glyph-primary",
  failed: "glyph-error",
  done: "glyph-success",
  pending: "glyph-secondary"
};

export interface TimelineSummary {
  kind: TimelineSummaryKind;
  completed: number;
  total: number;
}

export function groupPlanStepsByTimeline(
  steps: PlanStep[]
): Map<string, PlanStep[]> {
  const groups = new Map<string, PlanStep[]>();
  for (const step of steps) {
    const timelineId = step.timeline_id ?? step.project_id ?? "unknown";
    const existing = groups.get(timelineId) ?? [];
    existing.push(step);
    groups.set(timelineId, existing);
  }
  return groups;
}

export function summarizeTimelineSteps(
  timelineSteps: PlanStep[]
): TimelineSummary {
  const total = timelineSteps.length;
  const completed = timelineSteps.filter((s) =>
    TERMINAL_STEP_STATUSES.has(s.status)
  ).length;
  const failed = timelineSteps.some((s) => s.status === "FAILED");
  const running = timelineSteps.some((s) => s.status === "RUNNING");

  if (running) return { kind: "running", completed, total };
  if (failed) return { kind: "failed", completed, total };
  if (completed === total) return { kind: "done", completed, total };
  return { kind: "pending", completed, total };
}
