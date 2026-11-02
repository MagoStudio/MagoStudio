import { afterEach, describe, expect, it, vi } from "vitest";

const { put, del, syncCloudProjectMetadata } = vi.hoisted(() => ({
  put: vi.fn(),
  del: vi.fn(),
  syncCloudProjectMetadata: vi.fn()
}));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { put, delete: del }
}));
vi.mock("@domains/scriptProject/syncCloudScriptProjects", () => ({
  syncCloudProjectMetadata
}));
vi.mock("@/platform/localDesktop", () => ({
  isLocalApp: true,
  getLocalDesktopApi: () => window.mago
}));

import { deleteTimeline } from "./deleteTimeline";
import { putTimeline } from "./putTimeline";

const stubDesktop = (origin: "local" | "cloud") => {
  const shots = {
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined)
  };
  vi.stubGlobal("mago", {
    shots,
    projects: { get: vi.fn().mockResolvedValue({ id: "project-1", origin }) }
  });
  return shots;
};

describe("timeline writes in the desktop app", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("renames a cloud project's shot in the cloud, then mirrors it back", async () => {
    const shots = stubDesktop("cloud");
    put.mockResolvedValue({ data: { id: "shot-1" } });

    await putTimeline("shot-1", {
      name: "New",
      settings: {},
      project_id: "project-1"
    });

    expect(put).toHaveBeenCalledWith("/timeline/shot-1", expect.anything());
    expect(syncCloudProjectMetadata).toHaveBeenCalledWith("project-1");
    expect(shots.update).not.toHaveBeenCalled();
  });

  it("renames a local project's shot in the library", async () => {
    const shots = stubDesktop("local");

    await putTimeline("shot-1", {
      name: "New",
      settings: {},
      project_id: "project-1"
    });

    expect(shots.update).toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it("deletes a cloud project's shot in the cloud, then mirrors it back", async () => {
    const shots = stubDesktop("cloud");

    await deleteTimeline("shot-1", "project-1");

    expect(del).toHaveBeenCalledWith("/timeline/shot-1");
    expect(syncCloudProjectMetadata).toHaveBeenCalledWith("project-1");
    expect(shots.delete).not.toHaveBeenCalled();
  });

  it("deletes a shot from the library when no cloud project is named", async () => {
    const shots = stubDesktop("local");

    await deleteTimeline("shot-1");

    expect(shots.delete).toHaveBeenCalledWith("shot-1");
    expect(del).not.toHaveBeenCalled();
  });
});
