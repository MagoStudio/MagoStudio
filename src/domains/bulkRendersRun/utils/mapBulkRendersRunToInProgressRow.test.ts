import { BulkRendersRun, BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { mapBulkRendersRunToInProgressRow } from "./mapBulkRendersRunToInProgressRow";

const NOW = new Date("2026-07-29T12:05:01Z");

const buildRun = (overrides: Partial<BulkRendersRun>): BulkRendersRun => ({
  id: "run-1",
  status: "RUNNING",
  name: "Bulk 1_Mago Style Transfer",
  project_id: "project-1",
  parent_plan_id: null,
  error: null,
  created_at: "2026-07-29T11:50:00Z",
  input_settings: {
    img2img_settings: null,
    video_settings: null,
    timeline_ids: ["shot-1", "shot-2"]
  },
  total_steps: 10,
  completed_steps: 2,
  progress_pct: 20,
  current_step: null,
  stats: null,
  ...overrides
});

const buildStep = (overrides: {
  timelineId: string;
  toolName: string;
  status: BulkRendersRunStep["status"];
}): BulkRendersRunStep => ({
  id: `${overrides.timelineId}-${overrides.toolName}`,
  plan_id: "run-1",
  timeline_id: overrides.timelineId,
  step_order: 0,
  tool_name: overrides.toolName,
  status: overrides.status,
  result: null,
  error: null,
  retry_count: null,
  started_at: null,
  finished_at: null
});

describe("mapBulkRendersRunToInProgressRow", () => {
  it("shows the queued treatment for a pending run: no elapsed time and no current step", () => {
    const pendingRun = buildRun({
      status: "PENDING",
      current_step: null,
      progress_pct: 0
    });

    const row = mapBulkRendersRunToInProgressRow({
      run: pendingRun,
      steps: [],
      startedAt: null,
      now: NOW
    });

    expect(row.status).toBe("PENDING");
    expect(row.elapsedTimeLabel).toBeUndefined();
    expect(row.currentStepId).toBeUndefined();
    expect(row.currentStepNumber).toBeUndefined();
  });

  it("reports the current step and elapsed time for a running run", () => {
    const runningRun = buildRun({
      status: "RUNNING",
      current_step: buildStep({
        timelineId: "shot-1",
        toolName: "poll_img2img",
        status: "RUNNING"
      })
    });

    const row = mapBulkRendersRunToInProgressRow({
      run: runningRun,
      steps: [],
      startedAt: "2026-07-29T12:00:00Z",
      now: NOW
    });

    expect(row.currentStepId).toBe("image");
    expect(row.currentStepNumber).toBe(1);
    expect(row.elapsedTimeLabel).toBe("00:05:01");
  });

  it("shows no elapsed time while the run's own start time has not loaded yet", () => {
    const runningRun = buildRun({ status: "RUNNING" });

    const row = mapBulkRendersRunToInProgressRow({
      run: runningRun,
      steps: [],
      startedAt: undefined,
      now: NOW
    });

    expect(row.elapsedTimeLabel).toBeUndefined();
  });

  it("reports zero chain-completed counts for a run with no steps yet", () => {
    const freshRun = buildRun({ status: "RUNNING" });

    const row = mapBulkRendersRunToInProgressRow({
      run: freshRun,
      steps: [],
      startedAt: "2026-07-29T12:00:00Z",
      now: NOW
    });

    expect(row.imageChainCompletedCount).toBe(0);
    expect(row.videoChainCompletedCount).toBe(0);
    expect(row.imageTotalCount).toBe(2);
  });
});
