import { afterEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get }
}));

import { fetchProject } from "./fetchProject";

describe("fetchProject (desktop ownership)", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("does not send a locally-created project id to the cloud mirror", async () => {
    const project = {
      id: "local-script",
      name: "Local script",
      description: "",
      type: "script_to_shots",
      origin: "local",
      created_at: "2026-09-18T20:00:00.000Z",
      updated_at: "2026-09-18T20:00:00.000Z",
      active: true,
      settings: {},
      timelines: []
    };
    vi.stubGlobal("mago", {
      account: { mode: "cloud" },
      projects: { get: vi.fn().mockResolvedValue(project) }
    });

    await expect(fetchProject(project.id)).resolves.toMatchObject({
      id: project.id,
      origin: "local"
    });

    expect(get).not.toHaveBeenCalled();
  });

  it("returns a cached cloud project without waiting for the backend", async () => {
    const project = {
      id: "cloud-project",
      name: "Cached cloud project",
      description: "",
      type: "timeline",
      origin: "cloud",
      active: true,
      settings: {},
      timelines: []
    };
    vi.stubGlobal("mago", {
      account: { mode: "cloud" },
      projects: { get: vi.fn().mockResolvedValue(project) }
    });

    await expect(fetchProject(project.id)).resolves.toMatchObject({
      id: project.id,
      origin: "cloud"
    });
    expect(get).not.toHaveBeenCalled();
  });
});
