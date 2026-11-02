import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendApiClient } from "@/lib/backend-api-client";

import { removeImportedCloudMirrorProjects } from "./removeImportedCloudMirrorProjects";

const desktopApi = vi.hoisted(() => ({
  projects: { delete: vi.fn() }
}));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get: vi.fn() }
}));

vi.mock("@/platform/localDesktop", () => ({
  getLocalDesktopApi: () => desktopApi
}));

const libraryProject = (id: string, origin?: "local" | "cloud") => ({
  id,
  name: id,
  created_at: "",
  updated_at: "",
  total_renders: 0,
  total_img2img: 0,
  timeline_count: 0,
  preview_url: null,
  origin
});

const importedCloudProject = (id: string) => libraryProject(id, "cloud");

const cloudSettingsResponse = (settings: Record<string, unknown>) => ({
  data: { settings }
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe("removeImportedCloudMirrorProjects", () => {
  it("removes an imported mirror that the catalog no longer lists", async () => {
    vi.mocked(backendApiClient.get).mockResolvedValue(
      cloudSettingsResponse({ mirroredLocalProjectId: "local-1" })
    );

    await removeImportedCloudMirrorProjects({
      libraryProjects: [importedCloudProject("mirror-1")],
      catalogCloudProjectIds: new Set(),
      signal: new AbortController().signal
    });

    expect(backendApiClient.get).toHaveBeenCalledWith("/projects/mirror-1", {
      signal: expect.any(AbortSignal)
    });
    expect(desktopApi.projects.delete).toHaveBeenCalledWith("mirror-1");
  });

  it("never checks a project the catalog still lists", async () => {
    await removeImportedCloudMirrorProjects({
      libraryProjects: [importedCloudProject("cloud-1")],
      catalogCloudProjectIds: new Set(["cloud-1"]),
      signal: new AbortController().signal
    });

    expect(backendApiClient.get).not.toHaveBeenCalled();
    expect(desktopApi.projects.delete).not.toHaveBeenCalled();
  });

  it("keeps a missing cloud project that is not a mirror", async () => {
    vi.mocked(backendApiClient.get).mockResolvedValue(
      cloudSettingsResponse({ rangeMin: 0, rangeMax: 48 })
    );

    await removeImportedCloudMirrorProjects({
      libraryProjects: [importedCloudProject("cloud-1")],
      catalogCloudProjectIds: new Set(),
      signal: new AbortController().signal
    });

    expect(desktopApi.projects.delete).not.toHaveBeenCalled();
  });

  it("keeps a missing cloud project it cannot read", async () => {
    vi.mocked(backendApiClient.get).mockRejectedValue(
      new Error("Project not found")
    );

    await removeImportedCloudMirrorProjects({
      libraryProjects: [importedCloudProject("deleted-on-web")],
      catalogCloudProjectIds: new Set(),
      signal: new AbortController().signal
    });

    expect(desktopApi.projects.delete).not.toHaveBeenCalled();
  });

  it("leaves local projects alone", async () => {
    await removeImportedCloudMirrorProjects({
      libraryProjects: [
        libraryProject("local-1", "local"),
        libraryProject("legacy-local")
      ],
      catalogCloudProjectIds: new Set(),
      signal: new AbortController().signal
    });

    expect(backendApiClient.get).not.toHaveBeenCalled();
  });

  it("stops once the sync is cancelled", async () => {
    const controller = new AbortController();
    controller.abort();

    await removeImportedCloudMirrorProjects({
      libraryProjects: [importedCloudProject("mirror-1")],
      catalogCloudProjectIds: new Set(),
      signal: controller.signal
    });

    expect(backendApiClient.get).not.toHaveBeenCalled();
  });
});
