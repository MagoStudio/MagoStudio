import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendApiClient } from "@/lib/backend-api-client";

import { markLinkedCloudMirrorProjects } from "./markLinkedCloudMirrorProjects";

const desktopApi = vi.hoisted(() => ({
  cloud: { links: { get: vi.fn(), patch: vi.fn() } }
}));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get: vi.fn(), put: vi.fn() }
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

const projectLink = (
  localId: string,
  cloudId: string,
  data: Record<string, unknown> = {}
) => ({ kind: "project", localId, cloudId, syncedAt: null, data });

const openSignal = () => new AbortController().signal;

beforeEach(() => {
  vi.resetAllMocks();
  desktopApi.cloud.links.get.mockResolvedValue(null);
});

describe("markLinkedCloudMirrorProjects", () => {
  it("adds the marker to a linked mirror and keeps its other settings", async () => {
    desktopApi.cloud.links.get.mockResolvedValue(
      projectLink("local-1", "cloud-1")
    );
    vi.mocked(backendApiClient.get).mockResolvedValue({
      data: {
        name: "My project",
        description: "notes",
        settings: { type: "timeline", pinnedTrackIds: ["track-1"] }
      }
    });

    await markLinkedCloudMirrorProjects({
      libraryProjects: [libraryProject("local-1")],
      signal: openSignal()
    });

    expect(backendApiClient.put).toHaveBeenCalledWith(
      "/projects/cloud-1",
      {
        name: "My project",
        description: "notes",
        settings: {
          type: "timeline",
          pinnedTrackIds: ["track-1"],
          mirroredLocalProjectId: "local-1"
        }
      },
      { signal: expect.any(AbortSignal) }
    );
    expect(desktopApi.cloud.links.patch).toHaveBeenCalledWith({
      kind: "project",
      localId: "local-1",
      patch: { isCloudProjectMarkedAsMirror: true }
    });
  });

  it("skips a mirror the link already records as marked", async () => {
    desktopApi.cloud.links.get.mockResolvedValue(
      projectLink("local-1", "cloud-1", { isCloudProjectMarkedAsMirror: true })
    );

    await markLinkedCloudMirrorProjects({
      libraryProjects: [libraryProject("local-1")],
      signal: openSignal()
    });

    expect(backendApiClient.get).not.toHaveBeenCalled();
    expect(backendApiClient.put).not.toHaveBeenCalled();
  });

  it("records a mirror whose cloud settings already carry the marker without rewriting it", async () => {
    desktopApi.cloud.links.get.mockResolvedValue(
      projectLink("local-1", "cloud-1")
    );
    vi.mocked(backendApiClient.get).mockResolvedValue({
      data: { name: "n", settings: { mirroredLocalProjectId: "local-1" } }
    });

    await markLinkedCloudMirrorProjects({
      libraryProjects: [libraryProject("local-1")],
      signal: openSignal()
    });

    expect(backendApiClient.put).not.toHaveBeenCalled();
    expect(desktopApi.cloud.links.patch).toHaveBeenCalledOnce();
  });

  it("never rewrites a mirror whose name it could not read", async () => {
    desktopApi.cloud.links.get.mockResolvedValue(
      projectLink("local-1", "cloud-1")
    );
    vi.mocked(backendApiClient.get).mockResolvedValue({
      data: { settings: {} }
    });
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await markLinkedCloudMirrorProjects({
      libraryProjects: [libraryProject("local-1")],
      signal: openSignal()
    });

    expect(backendApiClient.put).not.toHaveBeenCalled();
    expect(desktopApi.cloud.links.patch).not.toHaveBeenCalled();
  });

  it("leaves cloud projects and unlinked local projects alone", async () => {
    await markLinkedCloudMirrorProjects({
      libraryProjects: [
        libraryProject("cloud-owned", "cloud"),
        libraryProject("never-rendered-in-cloud", "local")
      ],
      signal: openSignal()
    });

    expect(desktopApi.cloud.links.get).toHaveBeenCalledOnce();
    expect(desktopApi.cloud.links.get).toHaveBeenCalledWith(
      "project",
      "never-rendered-in-cloud"
    );
    expect(backendApiClient.get).not.toHaveBeenCalled();
  });

  it("carries on with the next mirror when one cannot be marked", async () => {
    desktopApi.cloud.links.get.mockImplementation(
      async (_kind: string, localId: string) =>
        projectLink(localId, `cloud-of-${localId}`)
    );
    vi.mocked(backendApiClient.get)
      .mockRejectedValueOnce(new Error("Project not found"))
      .mockResolvedValueOnce({ data: { name: "n", settings: {} } });
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await markLinkedCloudMirrorProjects({
      libraryProjects: [libraryProject("local-1"), libraryProject("local-2")],
      signal: openSignal()
    });

    expect(backendApiClient.put).toHaveBeenCalledOnce();
    expect(backendApiClient.put).toHaveBeenCalledWith(
      "/projects/cloud-of-local-2",
      expect.anything(),
      expect.anything()
    );
  });

  it("passes over a mirror the cloud no longer has without a warning", async () => {
    desktopApi.cloud.links.get.mockResolvedValue(
      projectLink("local-1", "deleted-mirror")
    );
    vi.mocked(backendApiClient.get).mockRejectedValue(
      new AxiosError("Not found", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 404,
        statusText: "",
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: {}
      })
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await markLinkedCloudMirrorProjects({
      libraryProjects: [libraryProject("local-1")],
      signal: openSignal()
    });

    expect(warn).not.toHaveBeenCalled();
    expect(backendApiClient.put).not.toHaveBeenCalled();
  });

  it("stops at the next project once the sync is cancelled", async () => {
    const controller = new AbortController();
    desktopApi.cloud.links.get.mockImplementation(async () => {
      controller.abort();
      return null;
    });

    await markLinkedCloudMirrorProjects({
      libraryProjects: [libraryProject("local-1"), libraryProject("local-2")],
      signal: controller.signal
    });

    expect(desktopApi.cloud.links.get).toHaveBeenCalledOnce();
  });
});
