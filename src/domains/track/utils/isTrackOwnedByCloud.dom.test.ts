import { afterEach, describe, expect, it, vi } from "vitest";

import { isTrackOwnedByCloud } from "./isTrackOwnedByCloud";

const stubLibraryProject = (project: Record<string, unknown> | null) => {
  const get = vi.fn().mockResolvedValue(project);
  vi.stubGlobal("mago", { projects: { get } });
  return get;
};

describe("isTrackOwnedByCloud", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the track's ownership from the library project", async () => {
    const get = stubLibraryProject({
      id: "project-1",
      origin: "cloud",
      timelines: [
        {
          id: "shot-1",
          layers: [
            { id: "mirrored-track", cloud_mirrored: true },
            { id: "local-render-track", cloud_mirrored: false }
          ]
        }
      ]
    });

    await expect(
      isTrackOwnedByCloud({ projectId: "project-1", trackId: "mirrored-track" })
    ).resolves.toBe(true);
    await expect(
      isTrackOwnedByCloud({
        projectId: "project-1",
        trackId: "local-render-track"
      })
    ).resolves.toBe(false);
    expect(get).toHaveBeenCalledWith("project-1");
  });

  it("treats a track as local when no project is named", async () => {
    const get = stubLibraryProject(null);

    await expect(
      isTrackOwnedByCloud({ projectId: undefined, trackId: "track-1" })
    ).resolves.toBe(false);
    expect(get).not.toHaveBeenCalled();
  });
});
