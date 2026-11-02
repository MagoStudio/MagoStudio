import { afterEach, describe, expect, it, vi } from "vitest";

const { handlers } = vi.hoisted(() => ({
  handlers: new Map<string, (event: unknown, value: unknown) => unknown>()
}));

vi.mock("electron", () => ({
  ipcMain: {
    handle: (
      channel: string,
      handler: (event: unknown, value: unknown) => unknown
    ) => handlers.set(channel, handler)
  }
}));
vi.mock("./trustedSender", () => ({ requireTrustedSender: () => undefined }));
vi.mock("../imageRenders/imageRenderService", () => ({
  ImageRenderService: class {}
}));
vi.mock("../cloud/cloudRenderJobRepository", () => ({
  CloudRenderJobRepository: class {}
}));

import { IPC_CHANNELS } from "../../shared/contracts";
import type { CloudRenderJobRepository } from "../cloud/cloudRenderJobRepository";
import type { ImageRenderService } from "../imageRenders/imageRenderService";

import { registerImageRenderHandlers } from "./registerImageRenderHandlers";

const submitVideo = vi.fn();

const submitVideoRender = (value: Record<string, unknown>) => {
  registerImageRenderHandlers(
    { submitVideo } as unknown as ImageRenderService,
    {} as CloudRenderJobRepository
  );
  const handler = handlers.get(IPC_CHANNELS.videoRendersSubmit);
  if (!handler) throw new Error("video render submit handler is missing");
  return handler({}, value);
};

const imageToVideoRender = {
  outputTrackId: "output-track",
  inputTrackId: "",
  frameRange: [0, 119],
  fps: 24,
  referenceImageIds: ["start-image"],
  estimatedCostUsd: 1.5,
  settings: { image_id: "start-image", prompt: "a slow pan" }
};

describe("video render submit IPC", () => {
  afterEach(() => {
    vi.clearAllMocks();
    handlers.clear();
  });

  it.each([
    "seedance_2",
    "seedance_2_i2v",
    "seedance_2_i2v_fast",
    "happy_horse_1",
    "kling_o1"
  ])("rejects cloud model %s at the local IPC boundary", async (model) => {
    await expect(
      submitVideoRender({ ...imageToVideoRender, model })
    ).rejects.toThrow("Unsupported local video model");
    expect(submitVideo).not.toHaveBeenCalled();
  });

  it("still requires an input track for a model that renders from a source video", async () => {
    await expect(
      submitVideoRender({ ...imageToVideoRender, model: "wan_animate_2_2" })
    ).rejects.toThrow("inputTrackId must be a string");
    expect(submitVideo).not.toHaveBeenCalled();
  });
});
