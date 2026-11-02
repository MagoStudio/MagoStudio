import { PlanStatus, PlanSummary } from "@schemas/plan";

import { ACTIVE_PLAN_STATUSES, HIDDEN_FROM_ALL_TAB } from "./planStatuses";

export type PlanFilterTab =
  | "all"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export function countByStatus(
  plans: PlanSummary[]
): Partial<Record<PlanStatus, number>> {
  const counts: Partial<Record<PlanStatus, number>> = {};
  for (const plan of plans) {
    counts[plan.status] = (counts[plan.status] ?? 0) + 1;
  }
  return counts;
}

export function filterPlansByTab(
  plans: PlanSummary[],
  tab: PlanFilterTab
): PlanSummary[] {
  if (tab === "all") {
    return plans.filter((p) => !HIDDEN_FROM_ALL_TAB.has(p.status));
  }
  if (tab === "RUNNING") {
    return plans.filter((p) => ACTIVE_PLAN_STATUSES.has(p.status));
  }
  return plans.filter((p) => p.status === tab);
}
