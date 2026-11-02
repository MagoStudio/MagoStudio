import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendApiClient } from "@/lib/backend-api-client";

import { fetchBulkRendersRuns } from "./fetchBulkRendersRuns";

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get: vi.fn() }
}));

const summary = (overrides: Record<string, unknown> = {}) => ({
  id: "run-1",
  status: "RUNNING",
  name: "Bulk render",
  project_id: "project-1",
  parent_plan_id: null,
  error: null,
  created_at: "2026-09-18T12:00:00Z",
  input_settings: {
    img2img_settings: null,
    video_settings: null,
    timeline_ids: ["shot-1"]
  },
  total_steps: 2,
  completed_steps: 1,
  progress_pct: 50,
  current_step: null,
  stats: null,
  ...overrides
});

describe("fetchBulkRendersRuns", () => {
  beforeEach(() => vi.clearAllMocks());

  it("silently ignores scenario plans whose shots are created during the run", async () => {
    vi.mocked(backendApiClient.get).mockResolvedValue({
      data: [
        summary(),
        summary({
          id: "scenario-1",
          name: "Scenario render",
          input_settings: {
            img2img_settings: null,
            video_settings: null,
            timeline_ids: null
          }
        })
      ]
    });
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});

    const runs = await fetchBulkRendersRuns();

    expect(runs.map((run) => run.id)).toEqual(["run-1"]);
    expect(warning).not.toHaveBeenCalled();
    warning.mockRestore();
  });
});
