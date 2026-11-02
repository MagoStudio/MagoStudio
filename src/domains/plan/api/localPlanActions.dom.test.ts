import { afterEach, describe, expect, it, vi } from "vitest";

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get, post }
}));

import { cancelPlan } from "./cancelPlan.local";
import { fetchPlanProgress } from "./fetchPlanProgress.local";
import { fetchPlanSteps } from "./fetchPlanSteps.local";
import { resumePlan } from "./resumePlan.local";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("local plan actions", () => {
  it("reads persisted local steps without contacting cloud", async () => {
    const getPlan = vi.fn().mockResolvedValue({
      id: "plan-1",
      local_operation: "shots",
      steps: [{ id: "step-1", tool_name: "poll_video_render" }]
    });
    vi.stubGlobal("mago", {
      scriptProjects: { getPlan }
    });

    await expect(fetchPlanSteps("plan-1")).resolves.toEqual([
      expect.objectContaining({ id: "step-1" })
    ]);
    expect(get).not.toHaveBeenCalled();
  });

  it("routes cancel and resume to the owner of a local plan", async () => {
    const localPlan = {
      id: "plan-1",
      status: "PAUSED",
      local_operation: "cast"
    };
    const getPlan = vi.fn().mockResolvedValue(localPlan);
    const cancelLocal = vi
      .fn()
      .mockResolvedValue({ ...localPlan, status: "CANCELLED" });
    const resumeLocal = vi
      .fn()
      .mockResolvedValue({ ...localPlan, status: "PENDING" });
    vi.stubGlobal("mago", {
      scriptProjects: {
        getPlan,
        cancelPlan: cancelLocal,
        resumePlan: resumeLocal
      }
    });

    await expect(cancelPlan("plan-1")).resolves.toMatchObject({
      status: "CANCELLED"
    });
    await expect(resumePlan("plan-1")).resolves.toMatchObject({
      status: "PENDING"
    });
    expect(post).not.toHaveBeenCalled();
  });
});

describe("mirrored cloud plans", () => {
  const mirroredCloudPlan = {
    id: "cloud-plan-1",
    status: "RUNNING",
    input_data: { project_id: "cloud-project-1" },
    steps: [{ id: "stale-step" }]
  };

  it("reads progress and steps from the cloud while signed in", async () => {
    vi.stubGlobal("mago", {
      account: { mode: "cloud" },
      scriptProjects: { getPlan: vi.fn().mockResolvedValue(mirroredCloudPlan) }
    });
    get.mockResolvedValueOnce({ data: [{ id: "live-step" }] });
    get.mockResolvedValueOnce({
      data: { id: "cloud-plan-1", status: "RUNNING" }
    });

    await expect(fetchPlanSteps("cloud-plan-1")).resolves.toEqual([
      { id: "live-step" }
    ]);
    await fetchPlanProgress("cloud-plan-1");
    expect(get).toHaveBeenNthCalledWith(1, "/agent/plans/cloud-plan-1/steps");
    expect(get).toHaveBeenNthCalledWith(
      2,
      "/agent/plans/cloud-plan-1/progress"
    );
  });

  it("keeps showing the mirrored plan when the cloud is unreachable", async () => {
    vi.stubGlobal("mago", {
      account: { mode: "offline" },
      scriptProjects: { getPlan: vi.fn().mockResolvedValue(mirroredCloudPlan) }
    });

    await expect(fetchPlanSteps("cloud-plan-1")).resolves.toEqual([
      { id: "stale-step" }
    ]);
    expect(get).not.toHaveBeenCalled();
  });

  it("cancels and resumes a cloud plan through the cloud, never locally", async () => {
    const cancelLocal = vi.fn();
    const resumeLocal = vi.fn();
    vi.stubGlobal("mago", {
      account: { mode: "cloud" },
      scriptProjects: {
        getPlan: vi.fn().mockResolvedValue(mirroredCloudPlan),
        cancelPlan: cancelLocal,
        resumePlan: resumeLocal
      }
    });
    post.mockResolvedValue({ data: { id: "cloud-plan-1" } });

    await cancelPlan("cloud-plan-1");
    await resumePlan("cloud-plan-1");

    expect(post).toHaveBeenNthCalledWith(1, "/agent/plans/cloud-plan-1/cancel");
    expect(post).toHaveBeenNthCalledWith(2, "/agent/plans/cloud-plan-1/resume");
    expect(cancelLocal).not.toHaveBeenCalled();
    expect(resumeLocal).not.toHaveBeenCalled();
  });
});
