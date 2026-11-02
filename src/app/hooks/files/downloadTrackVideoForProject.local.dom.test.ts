import { afterEach, describe, expect, it, vi } from "vitest";

const { downloadLayerVideo } = vi.hoisted(() => ({
  downloadLayerVideo: vi.fn()
}));

vi.mock("./downloadFiles", () => ({ downloadLayerVideo }));
vi.mock("@/platform/localDesktop", () => ({
  isLocalApp: true,
  getLocalDesktopApi: () => window.mago
}));

import { downloadTrackVideoForProject } from "./downloadTrackVideoForProject";

const stubDesktop = (
  origin: "local" | "cloud",
  layers: Record<string, unknown>[] = [],
  assetData: Record<string, unknown> = {}
) => {
  const assets = {
    get: vi.fn().mockResolvedValue({
      id: "asset-1",
      name: "Render",
      filepath: "mago-media://asset/asset-1",
      data: assetData
    })
  };
  vi.stubGlobal("mago", {
    assets,
    projects: {
      get: vi.fn().mockResolvedValue({
        id: "project-1",
        origin,
        timelines: [{ id: "shot-1", layers }]
      })
    }
  });
  return assets;
};

describe("downloadTrackVideoForProject in the desktop app", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("reads a local project's render from the library", async () => {
    stubDesktop("local");
    const fetchLibraryFile = vi
      .fn()
      .mockResolvedValue(new Response("video", { status: 200 }));
    vi.stubGlobal("fetch", fetchLibraryFile);

    const video = await downloadTrackVideoForProject({
      projectId: "project-1",
      trackId: "track-1",
      assetId: "asset-1"
    });

    expect(fetchLibraryFile).toHaveBeenCalledWith("mago-media://asset/asset-1");
    expect(video.size).toBe("video".length);
    expect(downloadLayerVideo).not.toHaveBeenCalled();
  });

  it("downloads a cloud project's render from the cloud while the mirror has not cached it", async () => {
    stubDesktop("cloud", [], { cloudMirror: true, status: "created" });
    const fetchLibraryFile = vi.fn();
    vi.stubGlobal("fetch", fetchLibraryFile);
    const cloudVideo = new Blob(["cloud"]);
    downloadLayerVideo.mockResolvedValue(cloudVideo);

    const video = await downloadTrackVideoForProject({
      projectId: "project-1",
      trackId: "track-1",
      assetId: "asset-1"
    });

    expect(downloadLayerVideo).toHaveBeenCalledWith({ layerId: "track-1" });
    expect(video).toBe(cloudVideo);
    expect(fetchLibraryFile).not.toHaveBeenCalled();
  });

  it("reads a cloud project's render from the mirror's local copy once it is cached", async () => {
    stubDesktop("cloud", [], { cloudMirror: true, status: "ingested" });
    const fetchLibraryFile = vi
      .fn()
      .mockResolvedValue(new Response("mirrored", { status: 200 }));
    vi.stubGlobal("fetch", fetchLibraryFile);

    const video = await downloadTrackVideoForProject({
      projectId: "project-1",
      trackId: "track-1",
      assetId: "asset-1"
    });

    expect(fetchLibraryFile).toHaveBeenCalledWith("mago-media://asset/asset-1");
    expect(video.size).toBe("mirrored".length);
    expect(downloadLayerVideo).not.toHaveBeenCalled();
  });

  it("reads a cloud project's local-only render from the library", async () => {
    stubDesktop("cloud", [{ id: "track-1", cloud_mirrored: false }]);
    const fetchLibraryFile = vi
      .fn()
      .mockResolvedValue(new Response("video", { status: 200 }));
    vi.stubGlobal("fetch", fetchLibraryFile);

    await downloadTrackVideoForProject({
      projectId: "project-1",
      trackId: "track-1",
      assetId: "asset-1"
    });

    expect(fetchLibraryFile).toHaveBeenCalledWith("mago-media://asset/asset-1");
    expect(downloadLayerVideo).not.toHaveBeenCalled();
  });

  it("fails when a local track has no rendered asset", async () => {
    stubDesktop("local");

    await expect(
      downloadTrackVideoForProject({
        projectId: "project-1",
        trackId: "track-1",
        assetId: undefined
      })
    ).rejects.toThrow("This track has no rendered video");
  });

  it("fails when the library cannot serve the file", async () => {
    stubDesktop("local");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Not found", { status: 404 }))
    );

    await expect(
      downloadTrackVideoForProject({
        projectId: "project-1",
        trackId: "track-1",
        assetId: "asset-1"
      })
    ).rejects.toThrow("Local video file could not be read");
  });
});
