import {
  BulkRendersRun,
  BulkRendersRunDetail,
  BulkRendersRunStep
} from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { mapBulkRendersRunToHistoryRow } from "./mapBulkRendersRunToHistoryRow";

const buildRun = (overrides: Partial<BulkRendersRun>): BulkRendersRun => ({
  id: "run-1",
  status: "COMPLETED",
  name: "Bulk 2_Mago Style Transfer",
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
  completed_steps: 10,
  progress_pct: 100,
  current_step: null,
  stats: null,
  ...overrides
});

const buildDetail = (
  overrides: Partial<BulkRendersRunDetail>
): BulkRendersRunDetail => ({
  id: "run-1",
  started_at: "2026-07-29T12:15:00",
  finished_at: "2026-07-29T12:17:05",
  input_data: null,
  ...overrides
});

const buildStep = (overrides: {
  timelineId: string;
  toolName: string;
  status: BulkRendersRunStep["status"];
  result?: unknown;
}): BulkRendersRunStep => ({
  id: `${overrides.timelineId}-${overrides.toolName}`,
  plan_id: "run-1",
  timeline_id: overrides.timelineId,
  step_order: 0,
  tool_name: overrides.toolName,
  status: overrides.status,
  result: overrides.result ?? null,
  error: null,
  retry_count: null,
  started_at: null,
  finished_at: null
});

describe("mapBulkRendersRunToHistoryRow", () => {
  it("summarises a completed run with its timestamp, duration and step-derived counts", () => {
    const steps: BulkRendersRunStep[] = [
      buildStep({
        timelineId: "shot-1",
        toolName: "poll_img2img",
        status: "COMPLETED",
        result: { asset_id: "asset-1" }
      }),
      buildStep({
        timelineId: "shot-2",
        toolName: "poll_img2img",
        status: "COMPLETED",
        result: { asset_id: "asset-2" }
      })
    ];

    const row = mapBulkRendersRunToHistoryRow({
      run: buildRun({ status: "COMPLETED" }),
      detail: buildDetail({}),
      steps
    });

    expect(row.timestampLabel).toBe("12:15 29.07.2026");
    expect(row.durationLabel).toBe("2m 05s");
    expect(row.imageChainCompletedCount).toBe(2);
    expect(row.imageTotalCount).toBe(2);
    expect(row.imageChainErrorCount).toBe(0);
  });

  it("counts a failed step as an error even though it never reaches a quality summary", () => {
    const steps: BulkRendersRunStep[] = [
      buildStep({
        timelineId: "shot-1",
        toolName: "poll_img2img",
        status: "COMPLETED",
        result: { asset_id: "asset-1" }
      }),
      buildStep({
        timelineId: "shot-2",
        toolName: "poll_img2img",
        status: "FAILED"
      })
    ];

    const row = mapBulkRendersRunToHistoryRow({
      run: buildRun({ status: "FAILED" }),
      detail: buildDetail({}),
      steps
    });

    expect(row.imageChainCompletedCount).toBe(1);
    expect(row.imageChainErrorCount).toBe(1);
  });

  it("counts the run's own Shots, not the sum of completed and errored", () => {
    const row = mapBulkRendersRunToHistoryRow({
      run: buildRun({
        input_settings: {
          img2img_settings: null,
          video_settings: { skip_polling: false },
          timeline_ids: ["shot-1", "shot-2", "shot-3", "shot-4"]
        }
      }),
      detail: buildDetail({}),
      steps: []
    });

    expect(row.imageTotalCount).toBe(4);
    expect(row.videoTotalCount).toBe(4);
  });

  it("reports a zero video total when the run has no video chain", () => {
    const row = mapBulkRendersRunToHistoryRow({
      run: buildRun({
        input_settings: {
          img2img_settings: null,
          video_settings: null,
          timeline_ids: ["shot-1", "shot-2"]
        }
      }),
      detail: buildDetail({}),
      steps: []
    });

    expect(row.videoTotalCount).toBe(0);
  });

  it("shows no counts while the run's steps have not loaded yet", () => {
    const row = mapBulkRendersRunToHistoryRow({
      run: buildRun({ status: "CANCELLED" }),
      detail: buildDetail({}),
      steps: undefined
    });

    expect(row.timestampLabel).toBe("12:15 29.07.2026");
    expect(row.durationLabel).toBe("2m 05s");
    expect(row.imageChainCompletedCount).toBeUndefined();
    expect(row.imageTotalCount).toBeUndefined();
    expect(row.imageChainErrorCount).toBeUndefined();
    expect(row.videoChainCompletedCount).toBeUndefined();
    expect(row.videoTotalCount).toBeUndefined();
    expect(row.videoChainErrorCount).toBeUndefined();
  });

  it("shows a cancelled run's real counts once its steps have loaded", () => {
    const steps: BulkRendersRunStep[] = [
      buildStep({
        timelineId: "shot-1",
        toolName: "poll_img2img",
        status: "COMPLETED",
        result: { asset_id: "asset-1" }
      }),
      buildStep({
        timelineId: "shot-2",
        toolName: "poll_img2img",
        status: "FAILED"
      })
    ];

    const row = mapBulkRendersRunToHistoryRow({
      run: buildRun({ status: "CANCELLED" }),
      detail: buildDetail({}),
      steps
    });

    expect(row.imageChainCompletedCount).toBe(1);
    expect(row.imageChainErrorCount).toBe(1);
    expect(row.imageTotalCount).toBe(2);
  });

  it("falls back to the run's creation time when it was cancelled before it ever started", () => {
    const row = mapBulkRendersRunToHistoryRow({
      run: buildRun({
        status: "CANCELLED",
        created_at: "2026-07-29T11:50:00"
      }),
      detail: buildDetail({ started_at: null, finished_at: null }),
      steps: undefined
    });

    expect(row.timestampLabel).toBe("11:50 29.07.2026");
  });
});
