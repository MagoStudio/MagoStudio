import { afterEach, describe, expect, it, vi } from "vitest";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { post }
}));
vi.mock("@/platform/localDesktop", () => ({
  isLocalApp: true,
  getLocalDesktopApi: () => window.mago
}));

import { postTimeline } from "./postTimeline";

const stubDesktop = (origin: "local" | "cloud") => {
  const shots = { create: vi.fn().mockResolvedValue({ id: "local-shot" }) };
  vi.stubGlobal("mago", {
    shots,
    projects: { get: vi.fn().mockResolvedValue({ id: "project-1", origin }) }
  });
  return shots;
};

describe("postTimeline in the desktop app", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("creates a local project's shot in the library", async () => {
    const shots = stubDesktop("local");

    const shot = await postTimeline("project-1", "Image to Video");

    expect(shots.create).toHaveBeenCalledWith({
      projectId: "project-1",
      name: "Image to Video"
    });
    expect(shot).toEqual({ id: "local-shot" });
    expect(post).not.toHaveBeenCalled();
  });

  it("creates a cloud project's shot in the cloud", async () => {
    const shots = stubDesktop("cloud");
    post.mockResolvedValue({ data: { id: "cloud-shot" } });

    const shot = await postTimeline("project-1", "Image to Video");

    expect(post).toHaveBeenCalledWith("/timelines/project-1", {
      name: "Image to Video"
    });
    expect(shot).toEqual({ id: "cloud-shot" });
    expect(shots.create).not.toHaveBeenCalled();
  });
});
