import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mode: "offline" as "offline" | "cloud",
  listAll: vi.fn(),
  list: vi.fn(),
  getProject: vi.fn(),
  getSnapshot: vi.fn(),
  backendGet: vi.fn()
}));

vi.mock("@/platform/localDesktop", () => ({
  getLocalDesktopApi: () => ({
    account: { mode: mocks.mode },
    projects: {
      listAll: mocks.listAll,
      list: mocks.list,
      get: mocks.getProject
    },
    scriptProjects: { get: mocks.getSnapshot }
  })
}));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get: mocks.backendGet }
}));

import { splitBulkRendersRunListBySection } from "../utils/splitBulkRendersRunListBySection";

import { fetchBulkRendersRuns } from "./fetchBulkRendersRuns.local";

const plan = (
  id: string,
  operation: "sheets" | "shots",
  status = "COMPLETED"
) => ({
  id,
  status,
  name: id,
  project_id: "project-1",
  local_operation: operation,
  input_data: {
    project_id: "project-1",
    timeline_ids: operation === "shots" ? ["timeline-1"] : [],
    video_settings: operation === "shots" ? { local_h3_steps: 4 } : undefined
  },
  total_steps: 2,
  completed_steps: 2,
  progress_pct: 100,
  current_step: null,
  error: null,
  created_at: "2026-09-19T10:00:00.000Z",
  steps: []
});

describe("desktop bulk-render history", () => {
  beforeEach(() => {
    mocks.mode = "offline";
    Object.defineProperty(window, "mago", {
      configurable: true,
      get: () => ({
        account: { mode: mocks.mode },
        projects: { get: mocks.getProject }
      })
    });
    mocks.listAll.mockReset();
    mocks.list.mockReset().mockResolvedValue([
      { id: "project-1", name: "Local", origin: "local" },
      { id: "project-2", name: "Other", origin: "local" }
    ]);
    mocks.getProject.mockReset().mockImplementation(async (id: string) => ({
      id,
      name: "Local",
      origin: "local"
    }));
    mocks.getSnapshot.mockReset().mockImplementation((projectId: string) =>
      Promise.resolve(
        projectId === "project-1"
          ? {
              planDetails: {
                sheets: plan("sheets", "sheets"),
                shots: plan("shots", "shots")
              }
            }
          : { planDetails: {} }
      )
    );
    mocks.backendGet.mockReset();
  });

  it("loads durable local runs without contacting cloud", async () => {
    const runs = await fetchBulkRendersRuns();

    expect(runs.map((run) => run.id)).toEqual(["sheets", "shots"]);
    expect(
      runs.find((run) => run.id === "shots")?.input_settings
    ).toMatchObject({
      timeline_ids: ["timeline-1"],
      video_settings: { local_h3_steps: 4 }
    });
    expect(mocks.backendGet).not.toHaveBeenCalled();
  });

  it("shows succeeded local shot runs in history but keeps sheet plans out of the panel", async () => {
    const sections = splitBulkRendersRunListBySection({
      runs: await fetchBulkRendersRuns("project-1")
    });

    expect(sections.historyRuns.map((run) => run.id)).toEqual(["shots"]);
    expect(mocks.getSnapshot).toHaveBeenCalledTimes(1);
    expect(mocks.listAll).not.toHaveBeenCalled();
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it("does not wait for cloud history for a local project while signed in", async () => {
    mocks.mode = "cloud";
    const runs = await fetchBulkRendersRuns("project-1");
    expect(runs.map((run) => run.id)).toEqual(["sheets", "shots"]);
    expect(mocks.backendGet).not.toHaveBeenCalled();
  });

  it("still fetches cloud history for a cloud-owned project", async () => {
    mocks.mode = "cloud";
    mocks.getProject.mockResolvedValue({ id: "project-1", origin: "cloud" });
    mocks.backendGet.mockResolvedValue({ data: [] });
    await fetchBulkRendersRuns("project-1");
    expect(mocks.backendGet).toHaveBeenCalledWith("/agent/plans", {
      params: { project_id: "project-1" }
    });
  });

  it("returns no local history for a removed project", async () => {
    mocks.getProject.mockResolvedValue(null);
    expect(await fetchBulkRendersRuns("removed")).toEqual([]);
    expect(mocks.getSnapshot).not.toHaveBeenCalled();
  });

  it("merges cloud history with local history while signed in", async () => {
    mocks.mode = "cloud";
    mocks.backendGet.mockResolvedValue({
      data: [
        {
          ...plan("cloud", "shots"),
          local_operation: undefined,
          input_settings: { timeline_ids: ["cloud-timeline"] }
        }
      ]
    });

    const runs = await fetchBulkRendersRuns();

    expect(runs.map((run) => run.id).sort()).toEqual([
      "cloud",
      "sheets",
      "shots"
    ]);
  });
});
