import { BulkRendersRun } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { isListableBulkRendersRun } from "./isListableBulkRendersRun";

function buildRun(parentPlanId: string | null): BulkRendersRun {
  return {
    id: "run-1",
    status: "RUNNING",
    name: null,
    project_id: null,
    parent_plan_id: parentPlanId,
    error: null,
    created_at: null,
    total_steps: 0,
    completed_steps: 0,
    progress_pct: 0,
    stats: null
  } as BulkRendersRun;
}

describe("isListableBulkRendersRun", () => {
  it("accepts a top-level run", () => {
    expect(isListableBulkRendersRun(buildRun(null))).toBe(true);
  });

  it("rejects a child run", () => {
    expect(isListableBulkRendersRun(buildRun("parent-1"))).toBe(false);
  });
});
