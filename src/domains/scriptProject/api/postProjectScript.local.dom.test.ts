import { afterEach, describe, expect, it, vi } from "vitest";

import { backendApiClient } from "@/lib/backend-api-client";

import { postProjectScript } from "./postProjectScript";

const extendedCastingRequest = {
  projectId: "project-1",
  script: "INT. KITCHEN - DAY",
  maxShots: 12,
  isAtomicShotsRequested: true,
  isSequentialShotsRequested: true,
  isCharacterDesignVersionsRequested: true,
  isSeparateStyleRequested: true,
  isSeparateCameraRequested: true
};

describe("postProjectScript casting capabilities", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, "mago");
  });

  it("keeps the extended casting options for a local project", async () => {
    const cast = vi.fn().mockResolvedValue({ version: 1, plan_id: "plan-1" });
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        account: { mode: "local" },
        projects: {
          get: vi.fn().mockResolvedValue({
            id: "project-1",
            origin: "local",
            type: "script_to_shots"
          })
        },
        scriptProjects: { cast }
      }
    });

    await postProjectScript(extendedCastingRequest);

    // Sequential is not a casting option (the cloud has none either); the
    // rest reach the local pipeline.
    const { isSequentialShotsRequested: _sequential, ...castOptions } =
      extendedCastingRequest;
    expect(cast).toHaveBeenCalledWith(castOptions);
  });

  it("does not send unshipped extended options to Mago Cloud", async () => {
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        account: { mode: "cloud" },
        projects: {
          get: vi.fn().mockResolvedValue({
            id: "project-1",
            origin: "cloud",
            type: "script_to_shots"
          })
        }
      }
    });
    const post = vi
      .spyOn(backendApiClient, "post")
      .mockResolvedValue({ data: { version: 1, plan_id: "plan-1" } });

    await postProjectScript(extendedCastingRequest);

    expect(post).toHaveBeenCalledWith("/projects/project-1/script", {
      script: "INT. KITCHEN - DAY",
      max_shots: 12,
      atomic_shots: true
    });
  });

  it("passes the target length to the local cast and to Mago Cloud", async () => {
    const cast = vi.fn().mockResolvedValue({ version: 1, plan_id: "plan-1" });
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        account: { mode: "local" },
        projects: {
          get: vi
            .fn()
            .mockResolvedValueOnce({ id: "project-1", origin: "local" })
            .mockResolvedValueOnce({ id: "project-1", origin: "cloud" })
        },
        scriptProjects: { cast }
      }
    });
    const post = vi
      .spyOn(backendApiClient, "post")
      .mockResolvedValue({ data: { version: 1, plan_id: "plan-1" } });

    await postProjectScript({
      projectId: "project-1",
      script: "INT. KITCHEN - DAY",
      targetDurationS: 60
    });
    await postProjectScript({
      projectId: "project-1",
      script: "INT. KITCHEN - DAY",
      targetDurationS: 60
    });

    expect(cast).toHaveBeenCalledWith(
      expect.objectContaining({ targetDurationS: 60 })
    );
    expect(post).toHaveBeenCalledWith("/projects/project-1/script", {
      script: "INT. KITCHEN - DAY",
      target_duration_s: 60
    });
  });
});
