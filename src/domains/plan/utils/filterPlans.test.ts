import { PlanStatus, PlanSummary } from "@schemas/plan";
import { describe, expect, it } from "vitest";

import { countByStatus, filterPlansByTab } from "./filterPlans";

function plan(id: string, status: PlanStatus): PlanSummary {
  return {
    id,
    status,
    total_steps: 0,
    completed_steps: 0,
    progress_pct: 0,
    created_at: "2024-01-01T00:00:00Z"
  } as PlanSummary;
}

const plans: PlanSummary[] = [
  plan("1", "RUNNING"),
  plan("2", "PENDING"),
  plan("3", "COMPLETED"),
  plan("4", "FAILED"),
  plan("5", "CANCELLED"),
  plan("6", "PAUSED")
];

describe("countByStatus", () => {
  it("returns the count of plans for each status that appears", () => {
    expect(countByStatus(plans)).toMatchObject({
      RUNNING: 1,
      PENDING: 1,
      COMPLETED: 1,
      FAILED: 1,
      CANCELLED: 1,
      PAUSED: 1
    });
  });
});

describe("filterPlansByTab", () => {
  it("excludes cancelled plans from the 'all' tab", () => {
    const ids = filterPlansByTab(plans, "all").map((p) => p.id);
    expect(ids).not.toContain("5");
    expect(ids).toEqual(["1", "2", "3", "4", "6"]);
  });

  it("returns active plans (PENDING/RUNNING/PAUSED) for the 'RUNNING' tab", () => {
    const ids = filterPlansByTab(plans, "RUNNING").map((p) => p.id);
    expect(ids).toEqual(["1", "2", "6"]);
  });

  it("returns only matching plans for terminal-status tabs", () => {
    expect(filterPlansByTab(plans, "COMPLETED").map((p) => p.id)).toEqual([
      "3"
    ]);
    expect(filterPlansByTab(plans, "FAILED").map((p) => p.id)).toEqual(["4"]);
    expect(filterPlansByTab(plans, "CANCELLED").map((p) => p.id)).toEqual([
      "5"
    ]);
  });
});
