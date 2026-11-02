import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { backendApiClient } from "@/lib/backend-api-client";

import { executeCloudSheetPlan } from "../cloudSheetRender.local";

import { getSceneStoryboard } from "./getSceneStoryboard";
import { postSceneStoryboardGenerate } from "./postSceneStoryboardGenerate";
import { postShotStoryboardRender } from "./postShotStoryboardRender";
import { putSceneStoryboard } from "./putSceneStoryboard";

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn() }
}));
vi.mock("../cloudSheetRender.local", () => ({
  canUseCloudSheetModels: () => window.mago.account.mode === "cloud",
  executeCloudSheetPlan: vi.fn()
}));
const response = {
  timeline_id: "scene",
  storyboard: {
    status: "ready",
    version_count: 1,
    versions: [{ asset_id: "board", status: "available" }]
  }
};
let origin = "local";
const update = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  origin = "local";
  Object.defineProperty(window, "mago", {
    configurable: true,
    value: {
      account: { mode: "offline" },
      projects: { get: async () => ({ id: "p", origin, settings: {} }) },
      scriptProjects: { update }
    }
  });
});
afterEach(() => Reflect.deleteProperty(window, "mago"));
describe("local Storyboard routing", () => {
  it("reads, pins and disables a board through desktop IPC only", async () => {
    update.mockResolvedValue(response);
    expect(
      (await getSceneStoryboard({ projectId: "p", sceneTimelineId: "scene" }))
        .status
    ).toBe("ready");
    await putSceneStoryboard({
      projectId: "p",
      sceneTimelineId: "scene",
      selectedAssetId: null,
      isUsedInVideoRenders: false
    });
    expect(update).toHaveBeenLastCalledWith({
      projectId: "p",
      operation: "storyboard-update",
      payload: { timelineId: "scene", selected_asset_id: null, enabled: false }
    });
    expect(backendApiClient.put).not.toHaveBeenCalled();
    expect(backendApiClient.get).not.toHaveBeenCalled();
  });
  it("submits the local image model and never sends a local timeline to cloud rendering", async () => {
    update.mockResolvedValue({
      timeline_id: "scene",
      asset_id: "template",
      plan_id: "plan"
    });
    await postSceneStoryboardGenerate({
      projectId: "p",
      sceneTimelineId: "scene",
      renderModel: "flux2_klein_4b_q8_local"
    });
    expect(update).toHaveBeenLastCalledWith({
      projectId: "p",
      operation: "storyboard-generate",
      payload: { timelineId: "scene", renderModel: "flux2_klein_4b_q8_local" }
    });
    await postShotStoryboardRender({
      projectId: "p",
      sheetsTimelineId: "local-sheets",
      shotTimelineId: "scene",
      prompt: "old fallback",
      inputImageAssetIds: []
    });
    expect(backendApiClient.post).not.toHaveBeenCalled();
  });
  it("runs a cloud sheet plan for a local project only while signed in", async () => {
    update.mockResolvedValue({
      timeline_id: "scene",
      asset_id: "template",
      plan_id: "plan"
    });
    await expect(
      postSceneStoryboardGenerate({
        projectId: "p",
        sceneTimelineId: "scene",
        renderModel: "gpt_image_2_t2i"
      })
    ).rejects.toThrow("Sign in");
    Reflect.set(window.mago.account, "mode", "cloud");
    await postSceneStoryboardGenerate({
      projectId: "p",
      sceneTimelineId: "scene"
    });
    expect(executeCloudSheetPlan).toHaveBeenCalledWith("plan");
  });
  it("preserves the real cloud project endpoint and response", async () => {
    origin = "cloud";
    vi.mocked(backendApiClient.post).mockResolvedValue({
      data: { timeline_id: "scene", asset_id: "cloud-board" }
    });
    await postSceneStoryboardGenerate({
      projectId: "p",
      sceneTimelineId: "scene",
      renderModel: "qwen_image_2512_local"
    });
    expect(backendApiClient.post).toHaveBeenCalledWith(
      "/projects/p/shots/scene/storyboard/generate"
    );
    expect(update).not.toHaveBeenCalled();
  });
});
