import { afterEach, describe, expect, it, vi } from "vitest";

const { post, executeCloudSheetPlan } = vi.hoisted(() => ({
  post: vi.fn(),
  executeCloudSheetPlan: vi.fn()
}));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { post }
}));
vi.mock("@domains/scriptProject/cloudSheetRender.local", () => ({
  CLOUD_SHEET_EXECUTOR: "mago-cloud-renderer",
  executeCloudSheetPlan
}));

import { postBulkRendersRunResume } from "./postBulkRendersRunResume.local";

const pausedLocalSheetRun = (localExecutor?: string) => ({
  id: "plan-1",
  status: "PAUSED",
  project_id: "project-1",
  local_operation: "sheets",
  ...(localExecutor ? { local_executor: localExecutor } : {}),
  input_data: { project_id: "project-1", timeline_ids: [] },
  steps: []
});

const installDesktopPlan = (plan: Record<string, unknown>) => {
  const resumeLocal = vi.fn().mockResolvedValue({ ...plan, status: "PENDING" });
  vi.stubGlobal("mago", {
    scriptProjects: {
      getPlan: vi.fn().mockResolvedValue(plan),
      resumePlan: resumeLocal
    }
  });
  return resumeLocal;
};

describe("postBulkRendersRunResume (local run)", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("restarts the renderer for a Mago Cloud sheet run it resumes", async () => {
    const resumeLocal = installDesktopPlan(
      pausedLocalSheetRun("mago-cloud-renderer")
    );

    await postBulkRendersRunResume("plan-1");

    expect(resumeLocal).toHaveBeenCalledWith("plan-1");
    expect(executeCloudSheetPlan).toHaveBeenCalledWith("plan-1");
    expect(post).not.toHaveBeenCalled();
  });

  it("leaves a run the desktop renders itself to the desktop", async () => {
    const resumeLocal = installDesktopPlan(pausedLocalSheetRun());

    await postBulkRendersRunResume("plan-1");

    expect(resumeLocal).toHaveBeenCalledWith("plan-1");
    expect(executeCloudSheetPlan).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });
});
