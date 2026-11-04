import { afterEach, describe, expect, it, vi } from "vitest";

import { backendApiClient } from "@/lib/backend-api-client";

import { postGenerateProjectShots } from "./postGenerateProjectShots";

describe("postGenerateProjectShots (local project)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, "mago");
  });

  it.each([
    [undefined, 8],
    [2, 2],
    [3, 2],
    [4, 4],
    [8, 8],
    [12, 8]
  ])(
    "normalizes the requested H3 preset %s to %i steps",
    async (value, expected) => {
      const generateShots = vi.fn().mockResolvedValue({
        would_run: [],
        would_run_keys: [],
        would_run_timeline_ids: [],
        skipped: [],
        blocked: [],
        sequential_ignored: [],
        changed: {},
        changed_by_timeline_id: {},
        plan_id: null
      });
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
          scriptProjects: { generateShots }
        }
      });

      await postGenerateProjectShots({
        projectId: "project-1",
        isDryRun: false,
        videoSettings: {
          frame_range: [0, 72],
          ...(value === undefined ? {} : { local_h3_steps: value })
        }
      });

      expect(generateShots).toHaveBeenCalledWith(
        expect.objectContaining({
          videoSettings: {
            frame_range: [0, 72],
            local_h3_steps: expected,
            local_h3_legacy_workflow: false,
            local_h3_text_encoder: "vanilla",
            local_h3_model: "base"
          }
        })
      );
    }
  );

  it("forwards the H3 workflow, model and text-encoder selections", async () => {
    const generateShots = vi.fn().mockResolvedValue({
      would_run: [],
      would_run_keys: [],
      would_run_timeline_ids: [],
      skipped: [],
      blocked: [],
      sequential_ignored: [],
      changed: {},
      changed_by_timeline_id: {},
      plan_id: null
    });
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        account: { mode: "offline" },
        projects: {
          get: vi.fn().mockResolvedValue({
            id: "project-1",
            origin: "local",
            type: "script_to_shots"
          })
        },
        scriptProjects: { generateShots }
      }
    });

    await postGenerateProjectShots({
      projectId: "project-1",
      isDryRun: false,
      videoSettings: {
        local_h3_steps: 8,
        local_h3_legacy_workflow: true,
        local_h3_text_encoder: "vanilla",
        local_h3_model: "singularity"
      }
    });

    expect(generateShots).toHaveBeenCalledWith(
      expect.objectContaining({
        videoSettings: expect.objectContaining({
          local_h3_steps: 8,
          local_h3_legacy_workflow: true,
          local_h3_text_encoder: "vanilla",
          local_h3_model: "singularity"
        })
      })
    );
  });

  it("sends sequential run overrides to Mago Cloud", async () => {
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
    const post = vi.spyOn(backendApiClient, "post").mockResolvedValue({
      data: {
        would_run: [],
        would_run_keys: [],
        would_run_timeline_ids: [],
        skipped: [],
        blocked: [],
        sequential_ignored: [],
        changed: {},
        changed_by_timeline_id: {},
        plan_id: null
      }
    });

    await postGenerateProjectShots({
      projectId: "project-1",
      isDryRun: false,
      sequential: {
        default: { enabled: true, mode: "last_frame" }
      }
    });

    expect(post.mock.calls[0]?.[1]).toMatchObject({
      sequential: { default: { enabled: true, mode: "last_frame" } }
    });
  });
});
