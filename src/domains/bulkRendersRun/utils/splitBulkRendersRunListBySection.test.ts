import { BulkRendersRun, BulkRendersRunStatus } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { splitBulkRendersRunListBySection } from "./splitBulkRendersRunListBySection";

const PROJECT_ID = "project-1";

const buildRun = (overrides: {
  id: string;
  status: BulkRendersRunStatus;
  projectId?: string;
  parentPlanId?: string | null;
  createdAt?: string | null;
}): BulkRendersRun => ({
  id: overrides.id,
  status: overrides.status,
  name: null,
  project_id: overrides.projectId ?? PROJECT_ID,
  parent_plan_id: overrides.parentPlanId ?? null,
  error: null,
  created_at: overrides.createdAt ?? null,
  started_at: null,
  finished_at: null,
  input_settings: null,
  total_steps: 0,
  completed_steps: 0,
  progress_pct: 0,
  current_step: null,
  stats: null
});

describe("splitBulkRendersRunListBySection", () => {
  it("excludes a child run from both sections", () => {
    const childRun = buildRun({
      id: "child-run",
      status: "RUNNING",
      parentPlanId: "parent-run"
    });

    const { inProgressRuns, historyRuns } = splitBulkRendersRunListBySection({
      runs: [childRun]
    });

    expect(inProgressRuns).toEqual([]);
    expect(historyRuns).toEqual([]);
  });

  it("puts a paused run in progress, not history", () => {
    const pausedRun = buildRun({ id: "paused-run", status: "PAUSED" });

    const { inProgressRuns, historyRuns } = splitBulkRendersRunListBySection({
      runs: [pausedRun]
    });

    expect(inProgressRuns).toEqual([pausedRun]);
    expect(historyRuns).toEqual([]);
  });

  it("orders history newest first by creation time", () => {
    const oldestRun = buildRun({
      id: "oldest-run",
      status: "COMPLETED",
      createdAt: "2026-07-01T00:00:00Z"
    });
    const middleRun = buildRun({
      id: "middle-run",
      status: "FAILED",
      createdAt: "2026-08-01T00:00:00Z"
    });
    const newestRun = buildRun({
      id: "newest-run",
      status: "CANCELLED",
      createdAt: "2026-09-01T00:00:00Z"
    });

    const { historyRuns } = splitBulkRendersRunListBySection({
      runs: [oldestRun, newestRun, middleRun]
    });

    expect(historyRuns.map((run) => run.id)).toEqual([
      "newest-run",
      "middle-run",
      "oldest-run"
    ]);
  });

  it("keeps every Project's runs, because the panel is app-wide", () => {
    const ownRun = buildRun({ id: "own-run", status: "RUNNING" });
    const otherProjectRun = buildRun({
      id: "other-project-run",
      status: "COMPLETED",
      projectId: "project-2"
    });

    const { inProgressRuns, historyRuns } = splitBulkRendersRunListBySection({
      runs: [ownRun, otherProjectRun]
    });

    expect(inProgressRuns.map((run) => run.id)).toEqual(["own-run"]);
    expect(historyRuns.map((run) => run.id)).toEqual(["other-project-run"]);
  });

  it("excludes a child run of another Project too", () => {
    const parentRun = buildRun({ id: "parent-run", status: "COMPLETED" });
    const childRun = buildRun({
      id: "child-run",
      status: "COMPLETED",
      projectId: "project-2",
      parentPlanId: "parent-run"
    });

    const { historyRuns } = splitBulkRendersRunListBySection({
      runs: [parentRun, childRun]
    });

    expect(historyRuns.map((run) => run.id)).toEqual(["parent-run"]);
  });
});
