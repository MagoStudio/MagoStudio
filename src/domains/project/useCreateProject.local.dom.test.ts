import { afterEach, describe, expect, it, vi } from "vitest";

const { post, syncCloudProjectMetadata } = vi.hoisted(() => ({
  post: vi.fn(),
  syncCloudProjectMetadata: vi.fn()
}));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { post }
}));

vi.mock("@domains/scriptProject/syncCloudScriptProjects", () => ({
  syncCloudProjectMetadata
}));

import { STORAGE_KEY } from "@/platform/providerPreferences";

import { createProject } from "./useCreateProject.local";

const input = {
  projectName: "Untitled",
  projectDescription: "",
  rangeMin: 0,
  rangeMax: 99
};

describe("createProject (desktop)", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("honours an explicit local destination while signed in to cloud", async () => {
    const create = vi.fn().mockResolvedValue({
      id: "local-script",
      type: "script_to_shots",
      origin: "local"
    });
    vi.stubGlobal("mago", {
      account: { mode: "cloud" },
      library: {
        get: vi.fn().mockResolvedValue({ rootPath: "C:/library" })
      },
      projects: { create },
      scriptProjects: {
        put: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockResolvedValue(null)
      }
    });

    await createProject({
      ...input,
      projectType: "script_to_shots",
      creationTarget: "local"
    });

    expect(create).toHaveBeenCalledOnce();
    expect(post).not.toHaveBeenCalled();
  });

  it("creates a local script project when signed out", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ "mago-cloud": false, "local-comfy": true })
    );
    const create = vi.fn().mockResolvedValue({
      id: "local-script",
      type: "script_to_shots",
      origin: "local"
    });
    const putSnapshot = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("mago", {
      account: { mode: "offline" },
      library: {
        get: vi.fn().mockResolvedValue({ rootPath: "C:/library" })
      },
      projects: { create },
      scriptProjects: {
        put: putSnapshot,
        get: vi.fn().mockResolvedValue(null)
      }
    });

    await expect(
      createProject({ ...input, projectType: "script_to_shots" })
    ).resolves.toMatchObject({ id: "local-script", origin: "local" });

    expect(post).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({
      name: "Untitled",
      description: "",
      settings: {
        rangeMin: 0,
        rangeMax: 99,
        type: "script_to_shots"
      }
    });
    expect(putSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "local-script",
        scriptVersions: { active_version: null, versions: [] }
      })
    );
  });

  it("creates cloud script projects while ignoring the retired provider switch", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ "mago-cloud": false })
    );
    const create = vi.fn();
    const putSnapshot = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("mago", {
      account: { mode: "cloud" },
      library: { get: vi.fn(), choose: vi.fn() },
      projects: { create },
      scriptProjects: {
        put: putSnapshot,
        get: vi.fn().mockResolvedValue(null)
      }
    });
    post.mockResolvedValue({
      data: { id: "cloud-script", type: "script_to_shots" }
    });

    await expect(
      createProject({ ...input, projectType: "script_to_shots" })
    ).resolves.toMatchObject({ id: "cloud-script" });

    expect(post).toHaveBeenCalledWith("/projects", {
      name: "Untitled",
      description: "",
      type: "script_to_shots",
      settings: { rangeMin: 0, rangeMax: 99 }
    });
    expect(create).not.toHaveBeenCalled();
    expect(putSnapshot).toHaveBeenCalledWith({
      projectId: "cloud-script",
      project: { id: "cloud-script", type: "script_to_shots" },
      metadataOnly: true
    });
  });

  it("continues creating ordinary timeline projects in the local library", async () => {
    const create = vi.fn().mockResolvedValue({ id: "local-project" });
    vi.stubGlobal("mago", {
      library: {
        get: vi.fn().mockResolvedValue({ rootPath: "C:/library" }),
        choose: vi.fn()
      },
      projects: { create }
    });

    await expect(createProject(input)).resolves.toMatchObject({
      id: "local-project"
    });

    expect(create).toHaveBeenCalledWith({
      name: "Untitled",
      description: "",
      settings: { rangeMin: 0, rangeMax: 99 }
    });
    expect(post).not.toHaveBeenCalled();
  });

  it("creates and mirrors an ordinary timeline project in cloud when selected", async () => {
    vi.stubGlobal("mago", {
      account: { mode: "cloud" },
      library: { get: vi.fn() },
      projects: { create: vi.fn() }
    });
    post.mockResolvedValue({ data: { id: "cloud-project" } });
    syncCloudProjectMetadata.mockResolvedValue(undefined);

    await expect(
      createProject({ ...input, creationTarget: "cloud" })
    ).resolves.toMatchObject({ id: "cloud-project" });

    expect(post).toHaveBeenCalledWith("/projects", {
      name: "Untitled",
      description: "",
      settings: { rangeMin: 0, rangeMax: 99 }
    });
    expect(syncCloudProjectMetadata).toHaveBeenCalledWith("cloud-project");
  });
});
