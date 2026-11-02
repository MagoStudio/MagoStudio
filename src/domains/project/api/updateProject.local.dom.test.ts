import { afterEach, describe, expect, it, vi } from "vitest";

const { get, put, syncCloudProjectMetadata, writeScriptProjectSnapshot } =
  vi.hoisted(() => ({
    get: vi.fn(),
    put: vi.fn(),
    syncCloudProjectMetadata: vi.fn(),
    writeScriptProjectSnapshot: vi.fn()
  }));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get, put }
}));

vi.mock("@domains/scriptProject/syncCloudScriptProjects", () => ({
  syncCloudProjectMetadata
}));

vi.mock("@domains/scriptProject/scriptProjectSnapshot", () => ({
  writeScriptProjectSnapshot
}));

import { updateProject } from "./updateProject";

const staleMirrorSettings = {
  shot_engine: "stale-engine",
  sheet_render_model: "stale-sheet-model",
  output_size: [640, 360],
  deleted_in_cloud: true,
  origin: "cloud",
  cloudSummary: { total_renders: 3 },
  type: "timeline"
};

const freshCloudSettings = {
  shot_engine: "web-engine",
  sheet_render_model: "web-sheet-model",
  output_size: [1920, 1080],
  agent_chat: [{ role: "user", content: "hi" }],
  web_only_key: "kept",
  type: "timeline"
};

const stubDesktop = (project: Record<string, unknown>) => {
  const update = vi.fn().mockResolvedValue(project);
  vi.stubGlobal("mago", {
    account: { mode: "cloud" },
    projects: { get: vi.fn().mockResolvedValue(project), update }
  });
  return { update };
};

describe("updateProject (desktop)", () => {
  it.each(["local", "cloud"])(
    "saves %s visual style through project settings",
    async (origin) => {
      const { update } = stubDesktop({
        id: "p",
        origin,
        type: "script_to_shots",
        settings: { rangeMin: 0 }
      });
      get.mockResolvedValue({ data: { settings: { rangeMin: 0 } } });
      put.mockResolvedValue({ data: {} });
      await updateProject({
        projectId: "p",
        projectName: "Style",
        projectDescription: "",
        settings: { rangeMin: 0, visual_style: "Ink" },
        settingsPatch: { visual_style: "Ink" }
      });
      if (origin === "local") {
        expect(update).toHaveBeenCalledWith(
          expect.objectContaining({
            settings: {
              rangeMin: 0,
              visual_style: "Ink",
              type: "script_to_shots"
            }
          })
        );
        expect(put).not.toHaveBeenCalled();
      } else {
        expect(put).toHaveBeenCalledWith(
          "/projects/p",
          expect.objectContaining({
            settings: { rangeMin: 0, visual_style: "Ink" }
          })
        );
        expect(update).not.toHaveBeenCalled();
      }
    }
  );
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("bases a cloud project's PUT on fresh cloud settings plus the patch", async () => {
    stubDesktop({
      id: "cloud-project",
      origin: "cloud",
      type: "timeline",
      settings: staleMirrorSettings
    });
    get.mockResolvedValue({
      data: { id: "cloud-project", settings: freshCloudSettings }
    });
    put.mockResolvedValue({ data: {} });

    await updateProject({
      projectId: "cloud-project",
      projectName: "Renamed",
      projectDescription: "",
      settings: { ...staleMirrorSettings, pinnedTrackIds: { shot: "track" } },
      settingsPatch: { pinnedTrackIds: { shot: "track" } }
    });

    expect(get).toHaveBeenCalledWith("/projects/cloud-project");
    expect(put).toHaveBeenCalledWith("/projects/cloud-project", {
      name: "Renamed",
      description: "",
      settings: { ...freshCloudSettings, pinnedTrackIds: { shot: "track" } }
    });
  });

  it("sends a cloud project's visual style in the PUT the backend reads it from", async () => {
    stubDesktop({
      id: "cloud-project",
      origin: "cloud",
      type: "script_to_shots",
      settings: staleMirrorSettings
    });
    get.mockResolvedValue({
      data: { id: "cloud-project", settings: freshCloudSettings }
    });
    put.mockResolvedValue({ data: {} });

    await updateProject({
      projectId: "cloud-project",
      projectName: "Project",
      projectDescription: "",
      settings: { ...staleMirrorSettings, visual_style: "Ink wash" },
      settingsPatch: { visual_style: "Ink wash" }
    });

    expect(put).toHaveBeenCalledWith("/projects/cloud-project", {
      name: "Project",
      description: "",
      settings: { ...freshCloudSettings, visual_style: "Ink wash" }
    });
  });

  it("never sends local-only keys to the cloud even when the patch carries them", async () => {
    stubDesktop({
      id: "cloud-project",
      origin: "cloud",
      type: "timeline",
      settings: staleMirrorSettings
    });
    get.mockResolvedValue({
      data: {
        settings: { ...freshCloudSettings, origin: "cloud", cloudSummary: {} }
      }
    });
    put.mockResolvedValue({ data: {} });

    await updateProject({
      projectId: "cloud-project",
      projectName: "Name",
      projectDescription: null,
      settings: staleMirrorSettings,
      settingsPatch: {
        shot_engine: "local-engine",
        origin: "cloud",
        cloudSummary: { total_renders: 1 }
      }
    });

    const sentSettings = put.mock.calls[0]?.[1]?.settings;
    expect(sentSettings).not.toHaveProperty("origin");
    expect(sentSettings).not.toHaveProperty("cloudSummary");
    expect(sentSettings).toMatchObject({
      shot_engine: "local-engine",
      web_only_key: "kept"
    });
  });

  it("merges a whole-value key against the fresh cloud value and returns what it sent", async () => {
    stubDesktop({
      id: "cloud-project",
      origin: "cloud",
      type: "timeline",
      settings: staleMirrorSettings
    });
    get.mockResolvedValue({
      data: {
        settings: {
          ...freshCloudSettings,
          pinnedTrackIds: { webShot: "webTrack", unpinnedShot: "track" }
        }
      }
    });
    put.mockResolvedValue({ data: {} });

    const persistedSettings = await updateProject({
      projectId: "cloud-project",
      projectName: "Name",
      projectDescription: null,
      settings: { pinnedTrackIds: { localShot: "localTrack" } },
      settingsPatch: { pinnedTrackIds: { localShot: "localTrack" } },
      settingsMergeBase: { pinnedTrackIds: { unpinnedShot: "track" } }
    });

    const mergedPinnedTrackIds = {
      webShot: "webTrack",
      localShot: "localTrack"
    };
    expect(put.mock.calls[0]?.[1]?.settings).toEqual({
      ...freshCloudSettings,
      pinnedTrackIds: mergedPinnedTrackIds
    });
    expect(persistedSettings?.pinnedTrackIds).toEqual(mergedPinnedTrackIds);
  });

  it("keeps writing a local project's full settings to the local database", async () => {
    const { update } = stubDesktop({
      id: "local-project",
      origin: "local",
      type: "timeline",
      settings: { rangeMin: 0 }
    });

    await updateProject({
      projectId: "local-project",
      projectName: "Local",
      projectDescription: "",
      settings: { rangeMin: 0, shot_engine: "engine" },
      settingsPatch: { shot_engine: "engine" }
    });

    expect(get).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      projectId: "local-project",
      name: "Local",
      description: "",
      settings: { rangeMin: 0, shot_engine: "engine" }
    });
  });

  it("keeps a local project's stored settings when a rename omits them", async () => {
    const storedSettings = {
      rangeMin: 0,
      pinnedTrackIds: { shot: "track" },
      shotFolders: [{ id: "folder" }]
    };
    const { update } = stubDesktop({
      id: "local-project",
      origin: "local",
      type: "timeline",
      settings: storedSettings
    });

    await updateProject({
      projectId: "local-project",
      projectName: "Renamed",
      projectDescription: "",
      settingsPatch: {}
    });

    expect(update).toHaveBeenCalledWith({
      projectId: "local-project",
      name: "Renamed",
      description: "",
      settings: storedSettings
    });
  });
});
