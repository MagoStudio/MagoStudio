import { afterEach, describe, expect, it, vi } from "vitest";

const { post, put, del, syncCloudProjectMetadata } = vi.hoisted(() => ({
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  syncCloudProjectMetadata: vi.fn()
}));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { post, put, delete: del }
}));
vi.mock("@domains/scriptProject/syncCloudScriptProjects", () => ({
  syncCloudProjectMetadata
}));
vi.mock("@/platform/localDesktop", () => ({
  isLocalApp: true,
  getLocalDesktopApi: () => window.mago
}));

import { LayerType } from "@schemas/layer";

import { RatingType } from "../interface";

import { deleteTrack } from "./deleteTrack";
import { postTrack } from "./postLayer";
import { putTrack } from "./putTrack";

const stubDesktop = (
  origin: "local" | "cloud",
  layers: Record<string, unknown>[] = []
) => {
  const tracks = {
    create: vi.fn().mockResolvedValue({ id: "local-track" }),
    update: vi.fn().mockResolvedValue({ id: "track-1" }),
    delete: vi.fn().mockResolvedValue(undefined)
  };
  vi.stubGlobal("mago", {
    tracks,
    projects: {
      get: vi.fn().mockResolvedValue({
        id: "project-1",
        origin,
        timelines: [{ id: "shot-1", layers }]
      })
    }
  });
  return tracks;
};

const localRenderTrackOfCloudProject = {
  id: "track-1",
  cloud_mirrored: false
};

const newTrack = {
  shotId: "shot-1",
  trackName: "Render",
  trackType: LayerType.RENDER,
  data: { renderEngine: "magov2" },
  parentTrackOrder: 1
};

describe("track writes in the desktop app", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("creates a cloud project's track in the cloud, then mirrors it back", async () => {
    const tracks = stubDesktop("cloud");
    post.mockResolvedValue({ data: { id: "cloud-track" } });

    const created = await postTrack(newTrack, "project-1");

    expect(created).toEqual({ id: "cloud-track" });
    expect(post).toHaveBeenCalledWith("/layers", {
      timeline_id: "shot-1",
      type: LayerType.RENDER,
      name: "Render",
      data: { renderEngine: "magov2" },
      parent_layer_order: 1
    });
    expect(syncCloudProjectMetadata).toHaveBeenCalledWith("project-1");
    expect(tracks.create).not.toHaveBeenCalled();
  });

  it("creates a cloud project's local render output track in the library", async () => {
    const tracks = stubDesktop("cloud");

    const created = await postTrack(
      { ...newTrack, isOutputOfLocalProviderRender: true },
      "project-1"
    );

    expect(created).toEqual({ id: "local-track" });
    expect(tracks.create).toHaveBeenCalledWith({
      shotId: "shot-1",
      name: "Render",
      type: LayerType.RENDER,
      data: { renderEngine: "magov2" },
      parentTrackOrder: 1
    });
    expect(post).not.toHaveBeenCalled();
    expect(syncCloudProjectMetadata).not.toHaveBeenCalled();
  });

  it("creates a cloud project's cloud render output track in the cloud", async () => {
    const tracks = stubDesktop("cloud");
    post.mockResolvedValue({ data: { id: "cloud-track" } });

    await postTrack(
      { ...newTrack, isOutputOfLocalProviderRender: false },
      "project-1"
    );

    expect(post).toHaveBeenCalled();
    expect(tracks.create).not.toHaveBeenCalled();
  });

  it("creates a local project's track in the library", async () => {
    stubDesktop("local");

    const created = await postTrack(newTrack, "project-1");

    expect(created).toEqual({ id: "local-track" });
    expect(post).not.toHaveBeenCalled();
  });

  it("creates the track in the library when no project is named", async () => {
    const tracks = stubDesktop("cloud");

    await postTrack(newTrack);

    expect(tracks.create).toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it("updates a cloud project's track in the cloud, then mirrors it back", async () => {
    const tracks = stubDesktop("cloud");
    put.mockResolvedValue({ data: { id: "track-1" } });

    await putTrack({
      layerId: "track-1",
      layerName: "Hero",
      layerData: {},
      rating: RatingType.THREE_STARS,
      projectId: "project-1"
    });

    expect(put).toHaveBeenCalledWith("/layers/track-1", {
      name: "Hero",
      data: {},
      rating: RatingType.THREE_STARS
    });
    expect(syncCloudProjectMetadata).toHaveBeenCalledWith("project-1");
    expect(tracks.update).not.toHaveBeenCalled();
  });

  it("updates a cloud project's local-only track in the library", async () => {
    const tracks = stubDesktop("cloud", [localRenderTrackOfCloudProject]);

    await putTrack({
      layerId: "track-1",
      layerName: "Hero",
      layerData: {},
      projectId: "project-1"
    });

    expect(tracks.update).toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
    expect(syncCloudProjectMetadata).not.toHaveBeenCalled();
  });

  it("updates a cloud project's mirrored track in the cloud", async () => {
    const tracks = stubDesktop("cloud", [
      { id: "track-1", cloud_mirrored: true }
    ]);
    put.mockResolvedValue({ data: { id: "track-1" } });

    await putTrack({
      layerId: "track-1",
      layerName: "Hero",
      layerData: {},
      projectId: "project-1"
    });

    expect(put).toHaveBeenCalled();
    expect(tracks.update).not.toHaveBeenCalled();
  });

  it("updates a local project's track in the library", async () => {
    const tracks = stubDesktop("local");

    await putTrack({
      layerId: "track-1",
      layerName: "Hero",
      layerData: {},
      projectId: "project-1"
    });

    expect(tracks.update).toHaveBeenCalledWith({
      trackId: "track-1",
      name: "Hero",
      data: {},
      rating: undefined
    });
    expect(put).not.toHaveBeenCalled();
  });

  it("returns the mirrored local layer, not the bare cloud response, after a cloud update", async () => {
    const mirroredSourceTrack = {
      id: "track-1",
      cloud_mirrored: true,
      clips: [
        {
          data: { timeline_offset: 0, frame_range: [0, 242] },
          asset: { data: { duration: 242 } }
        }
      ]
    };
    stubDesktop("cloud", [mirroredSourceTrack]);
    put.mockResolvedValue({
      data: { id: "track-1", clips: [{ data: { duration: 1 }, asset: {} }] }
    });

    const layer = await putTrack({
      layerId: "track-1",
      layerName: "Source",
      layerData: {},
      projectId: "project-1"
    });

    expect(syncCloudProjectMetadata).toHaveBeenCalledWith("project-1");
    expect(layer).toEqual(mirroredSourceTrack);
  });

  it("deletes a cloud project's track in the cloud, then mirrors it back", async () => {
    const tracks = stubDesktop("cloud");

    await deleteTrack({ trackId: "track-1", projectId: "project-1" });

    expect(del).toHaveBeenCalledWith("/layers/track-1");
    expect(syncCloudProjectMetadata).toHaveBeenCalledWith("project-1");
    expect(tracks.delete).not.toHaveBeenCalled();
  });

  it("deletes a cloud project's local-only track from the library", async () => {
    const tracks = stubDesktop("cloud", [localRenderTrackOfCloudProject]);

    await deleteTrack({ trackId: "track-1", projectId: "project-1" });

    expect(tracks.delete).toHaveBeenCalledWith("track-1");
    expect(del).not.toHaveBeenCalled();
    expect(syncCloudProjectMetadata).not.toHaveBeenCalled();
  });

  it("deletes a local project's track from the library", async () => {
    const tracks = stubDesktop("local");

    await deleteTrack({ trackId: "track-1", projectId: "project-1" });

    expect(tracks.delete).toHaveBeenCalledWith("track-1");
    expect(del).not.toHaveBeenCalled();
  });
});
