import { afterEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get }
}));

import { fetchPlanDetail } from "./fetchPlanDetail.local";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("fetchPlanDetail (desktop)", () => {
  it("reads the casting plan from the durable snapshot offline", async () => {
    const getPlan = vi.fn().mockResolvedValue({
      id: "plan-1",
      status: "COMPLETED",
      created_at: "2026-09-18T10:00:00Z",
      updated_at: "2026-09-18T10:00:00Z",
      steps: [
        {
          tool_name: "submit_script_casting",
          tool_args: { script: "FADE IN" }
        }
      ]
    });
    vi.stubGlobal("mago", {
      account: { mode: "offline" },
      scriptProjects: { getPlan }
    });

    await expect(fetchPlanDetail("plan-1")).resolves.toMatchObject({
      id: "plan-1",
      steps: [expect.objectContaining({ tool_args: { script: "FADE IN" } })]
    });
    expect(getPlan).toHaveBeenCalledWith("plan-1");
    expect(get).not.toHaveBeenCalled();
  });
});
