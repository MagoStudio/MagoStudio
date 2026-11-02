import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendApiClient } from "@/lib/backend-api-client";

import { getSceneStoryboard } from "./getSceneStoryboard";
import { postSceneStoryboardGenerate } from "./postSceneStoryboardGenerate";
import { putSceneStoryboard } from "./putSceneStoryboard";

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn() }
}));
beforeEach(() => vi.clearAllMocks());
vi.mock("../projectOrigin", () => ({
  isLocalScriptProject: async () => false
}));

const sceneStoryboardResponse = {
  timeline_id: "scene",
  storyboard: {
    status: "ready",
    enabled: false,
    version_count: 1,
    versions: [{ asset_id: "v1", status: "success", origin: "generated" }]
  }
};

describe("scene storyboard API contracts", () => {
  it("asks the backend to draw a scene's storyboard with no body", async () => {
    vi.mocked(backendApiClient.post).mockResolvedValue({
      data: { timeline_id: "scene", clip_id: "clip", asset_id: "asset" }
    });
    await expect(
      postSceneStoryboardGenerate({
        projectId: "project",
        sceneTimelineId: "scene"
      })
    ).resolves.toMatchObject({ clip_id: "clip" });
    expect(backendApiClient.post).toHaveBeenCalledWith(
      "/projects/project/shots/scene/storyboard/generate"
    );
  });

  it("reads every version of a scene's storyboard", async () => {
    vi.mocked(backendApiClient.get).mockResolvedValue({
      data: sceneStoryboardResponse
    });
    const sceneStoryboard = await getSceneStoryboard({
      projectId: "project",
      sceneTimelineId: "scene"
    });
    expect(sceneStoryboard.versions.map((version) => version.asset_id)).toEqual(
      ["v1"]
    );
  });

  it("sends only the fields being changed, with the switch as `enabled`", async () => {
    vi.mocked(backendApiClient.put).mockResolvedValue({
      data: sceneStoryboardResponse
    });
    await putSceneStoryboard({
      projectId: "project",
      sceneTimelineId: "scene",
      isUsedInVideoRenders: false
    });
    expect(backendApiClient.put).toHaveBeenCalledWith(
      "/projects/project/shots/scene/storyboard",
      { enabled: false }
    );

    await putSceneStoryboard({
      projectId: "project",
      sceneTimelineId: "scene",
      selectedAssetId: null
    });
    expect(backendApiClient.put).toHaveBeenLastCalledWith(
      "/projects/project/shots/scene/storyboard",
      { selected_asset_id: null }
    );
  });
});
