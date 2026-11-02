import { describe, expect, test } from "vitest";

import { buildProjectStats, type ProjectStatsJobRow } from "./projectStats";

const job = (
  overrides: Partial<ProjectStatsJobRow> & Pick<ProjectStatsJobRow, "id">
): ProjectStatsJobRow => ({
  model: "seedance_2",
  status: "FINISHED",
  requestJson: JSON.stringify({
    name: "Render",
    estimatedCostUsd: 1,
    fps: 24,
    frameRange: [0, 23],
    settings: { resolution: "1080p" }
  }),
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  startedAt: new Date("2026-01-01T00:00:30.000Z"),
  finishedAt: new Date("2026-01-01T00:01:30.000Z"),
  ...overrides
});

describe("buildProjectStats", () => {
  test("returns empty totals when the project has no renders", () => {
    expect(buildProjectStats([])).toEqual({
      total: expect.objectContaining({
        total_amount_of_renders: 0,
        total_amount_of_successful_renders: 0,
        success_rate: 0,
        total_cost: 0,
        models_used: [],
        most_used_model: "",
        earliest_render_date: "",
        latest_render_date: ""
      })
    });
  });

  test("derives per-render figures from the stored fal request", () => {
    const stats = buildProjectStats([job({ id: "job-1" })]);

    expect(stats["job-1"]).toEqual(
      expect.objectContaining({
        name: "Render",
        cost: 1,
        success: true,
        number_of_frames: 24,
        resolution: "1080p",
        fps: 24,
        model: "seedance_2",
        queue_wait_time: 30,
        render_time_in_seconds: 60,
        video_duration_in_seconds: 1
      })
    );
  });

  test("counts only finished jobs as successful", () => {
    const stats = buildProjectStats([
      job({ id: "job-1" }),
      job({ id: "job-2", status: "FAILED", finishedAt: null })
    ]);

    expect(stats.total).toEqual(
      expect.objectContaining({
        total_amount_of_renders: 2,
        total_amount_of_successful_renders: 1,
        success_rate: 50,
        total_cost: 2,
        total_frames_rendered: 48
      })
    );
  });

  test("reports the most used model", () => {
    const stats = buildProjectStats([
      job({ id: "job-1", model: "happy_horse_1" }),
      job({ id: "job-2", model: "seedance_2" }),
      job({ id: "job-3", model: "seedance_2" })
    ]);

    expect(stats.total).toEqual(
      expect.objectContaining({
        models_used: ["happy_horse_1", "seedance_2"],
        most_used_model: "seedance_2"
      })
    );
  });

  test("survives an unparsable request payload", () => {
    const stats = buildProjectStats([
      job({ id: "job-1", requestJson: "not json" })
    ]);

    expect(stats["job-1"]).toEqual(
      expect.objectContaining({
        name: "job-1",
        cost: 0,
        number_of_frames: 1,
        resolution: "",
        fps: 0
      })
    );
  });

  test("prefers explicit pixel dimensions over the resolution tier", () => {
    const stats = buildProjectStats([
      job({
        id: "job-1",
        requestJson: JSON.stringify({
          settings: { width: 1024, height: 768, resolution: "1080p" }
        })
      })
    ]);

    expect(stats["job-1"]).toEqual(
      expect.objectContaining({ resolution: "1024x768" })
    );
  });
});
