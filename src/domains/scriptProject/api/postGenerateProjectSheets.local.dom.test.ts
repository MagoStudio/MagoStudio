import { afterEach, describe, expect, it, vi } from "vitest";

import { LOCAL_SHEET_RENDER_MODEL } from "../constants";

import { postGenerateProjectSheets } from "./postGenerateProjectSheets";

describe("postGenerateProjectSheets (local project)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, "mago");
  });

  it("rejects cloud image models and strips the cloud metrics option", async () => {
    const generateSheets = vi.fn().mockResolvedValue({
      would_run: ["hero"],
      skipped: [],
      changed: {},
      plan_id: "plan-1"
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
        scriptProjects: { generateSheets }
      }
    });

    await postGenerateProjectSheets({
      projectId: "project-1",
      isDryRun: false,
      outputSize: [720, 1280],
      tokens: ["hero"],
      settings: { render_model: "seedream_5_pro_t2i" },
      shouldScoreImages: true
    });

    expect(generateSheets).toHaveBeenCalledWith({
      projectId: "project-1",
      isDryRun: false,
      outputSize: [720, 1280],
      tokens: ["hero"],
      settings: { render_model: LOCAL_SHEET_RENDER_MODEL }
    });
    expect(generateSheets.mock.calls[0]?.[0]).not.toHaveProperty(
      "shouldScoreImages"
    );
  });

  it("preserves a supported local Flux image model", async () => {
    const generateSheets = vi.fn().mockResolvedValue({
      would_run: [],
      skipped: [],
      changed: {}
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
        scriptProjects: { generateSheets }
      }
    });

    await postGenerateProjectSheets({
      projectId: "project-1",
      isDryRun: true,
      settings: { render_model: "flux2_klein_4b_q8_local" }
    });

    expect(generateSheets).toHaveBeenCalledWith({
      projectId: "project-1",
      isDryRun: true,
      settings: { render_model: "flux2_klein_4b_q8_local" }
    });
  });
});
