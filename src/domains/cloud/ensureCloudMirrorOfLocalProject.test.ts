import { beforeEach, describe, expect, it, vi } from "vitest";

import { ensureCloudMirrorOfLocalProject } from "./ensureCloudMirrorOfLocalProject";

const mocks = vi.hoisted(() => ({
  getProject: vi.fn(),
  ensureCloudProject: vi.fn()
}));
vi.mock("@/platform/localDesktop", () => ({
  getLocalDesktopApi: () => ({ projects: { get: mocks.getProject } })
}));
vi.mock("./mirrorService", () => ({
  ensureCloudProject: mocks.ensureCloudProject
}));

const api = { get: vi.fn(), post: vi.fn() };

beforeEach(() => vi.resetAllMocks());

describe("ensureCloudMirrorOfLocalProject", () => {
  it("mirrors the local project under its own name", async () => {
    mocks.getProject.mockResolvedValue({ id: "local", name: "Heist" });
    mocks.ensureCloudProject.mockResolvedValue("cloud");

    expect(await ensureCloudMirrorOfLocalProject(api, "local")).toBe("cloud");
    expect(mocks.ensureCloudProject).toHaveBeenCalledExactlyOnceWith(api, {
      localProjectId: "local",
      name: "Heist"
    });
  });

  it("refuses a project the library does not have", async () => {
    mocks.getProject.mockResolvedValue(null);

    await expect(ensureCloudMirrorOfLocalProject(api, "gone")).rejects.toThrow(
      "Local project not found"
    );
    expect(mocks.ensureCloudProject).not.toHaveBeenCalled();
  });
});
