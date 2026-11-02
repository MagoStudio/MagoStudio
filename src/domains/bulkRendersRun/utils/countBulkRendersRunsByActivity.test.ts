import { BulkRendersRun } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { countBulkRendersRunsByActivity } from "./countBulkRendersRunsByActivity";

function buildRun(overrides: Partial<BulkRendersRun>): BulkRendersRun {
  return {
    id: "run-1",
    status: "RUNNING",
    name: null,
    project_id: null,
    parent_plan_id: null,
    error: null,
    created_at: null,
    total_steps: 0,
    completed_steps: 0,
    progress_pct: 0,
    stats: null,
    ...overrides
  } as BulkRendersRun;
}

describe("countBulkRendersRunsByActivity", () => {
  it("counts running and pending runs separately", () => {
    const counts = countBulkRendersRunsByActivity([
      buildRun({ id: "a", status: "RUNNING" }),
      buildRun({ id: "b", status: "RUNNING" }),
      buildRun({ id: "c", status: "PENDING" })
    ]);

    expect(counts).toEqual({ runningRunCount: 2, waitingRunCount: 1 });
  });

  it("counts neither paused nor terminal runs", () => {
    const counts = countBulkRendersRunsByActivity([
      buildRun({ id: "a", status: "PAUSED" }),
      buildRun({ id: "b", status: "COMPLETED" }),
      buildRun({ id: "c", status: "FAILED" }),
      buildRun({ id: "d", status: "CANCELLED" })
    ]);

    expect(counts).toEqual({ runningRunCount: 0, waitingRunCount: 0 });
  });

  it("ignores child runs, as the panel's own listing does", () => {
    const counts = countBulkRendersRunsByActivity([
      buildRun({ id: "a", status: "RUNNING", parent_plan_id: "parent-1" }),
      buildRun({ id: "b", status: "PENDING", parent_plan_id: "parent-1" }),
      buildRun({ id: "c", status: "RUNNING" })
    ]);

    expect(counts).toEqual({ runningRunCount: 1, waitingRunCount: 0 });
  });

  it("reports zero counts for an empty run list", () => {
    expect(countBulkRendersRunsByActivity([])).toEqual({
      runningRunCount: 0,
      waitingRunCount: 0
    });
  });
});
