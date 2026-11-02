import { RenderMode } from "@hooks/types";
import { seedance2I2vFastModel } from "@models/video/seedance2I2vFastModel";
import { seedance2I2vModel } from "@models/video/seedance2I2vModel";
import { VideoModelDefinition, VideoSettings } from "@models/video/types";
import { afterEach, describe, expect, it, vi } from "vitest";

const { submit, listAll, submitCloudImageToVideoRender, submitCloudRender } =
  vi.hoisted(() => ({
    submit: vi.fn(),
    listAll: vi.fn(),
    submitCloudImageToVideoRender: vi.fn(),
    submitCloudRender: vi.fn()
  }));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { post: vi.fn() }
}));
vi.mock("@/platform/localDesktop", () => ({
  isLocalApp: true,
  getLocalDesktopApi: () => ({
    videoRenders: { submit },
    projects: { listAll }
  })
}));
vi.mock("@domains/cloud/backendCloudApi", () => ({
  backendCloudApi: () => ({ post: vi.fn(), get: vi.fn() })
}));
vi.mock("@domains/cloud/submitCloudRender", () => ({ submitCloudRender }));
vi.mock("@domains/cloud/submitCloudImageToVideoRender", () => ({
  submitCloudImageToVideoRender
}));

import { postRender } from "./postRender";

const outputTrack = { id: "i2v-output-track", name: "Image to Video" };

const projectTreeWithImageOnlyContainerShot = [
  {
    id: "project-1",
    name: "My project",
    timelines: [
      {
        id: "container-shot",
        name: "Image to Video",
        layers: [outputTrack]
      }
    ]
  }
];

const submitImageToVideoRender = (model: VideoModelDefinition) =>
  postRender({
    parentLayerId: outputTrack.id,
    frameRange: [0, 120],
    renderSettings: {
      mago_engine: model.name,
      image_id: "start-image",
      end_image_id: "end-image",
      prompt: "a slow pan",
      durationInSeconds: 5,
      fps: 24,
      resolution: "720p",
      generate_audio: false
    } as unknown as VideoSettings,
    sources: [],
    inputTrackId: "",
    renderEngine: "magov2",
    renderMode: RenderMode.CREDITS,
    model,
    fps: 24
  });

describe("postRender — a signed-in Image-to-Video render", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([seedance2I2vModel, seedance2I2vFastModel])(
    "sends $name to Mago cloud with the image-only container shot and no source video",
    async (model) => {
      vi.stubGlobal("window", { mago: { account: { mode: "cloud" } } });
      listAll.mockResolvedValue(projectTreeWithImageOnlyContainerShot);
      submitCloudImageToVideoRender.mockResolvedValue({
        jobId: "job",
        cloudAssetId: "cloud-asset"
      });

      await expect(submitImageToVideoRender(model)).resolves.toEqual(
        outputTrack
      );

      expect(submit).not.toHaveBeenCalled();
      expect(submitCloudRender).not.toHaveBeenCalled();
      const submitted = submitCloudImageToVideoRender.mock.calls[0][1];
      expect(submitted).toMatchObject({
        local: {
          projectId: "project-1",
          projectName: "My project",
          shotId: "container-shot",
          shotName: "Image to Video",
          outputTrackId: outputTrack.id
        },
        model: model.name,
        fps: 24,
        frameRange: [0, 120]
      });
      expect(submitted.payload.sources).toEqual({});
      expect(submitted.payload.render_settings.magov2).toMatchObject({
        image_id: "start-image",
        end_image_id: "end-image",
        durationInSeconds: 5,
        fps: 24,
        frameRangeSeconds: [0, 5]
      });
    }
  );

  it("rejects cloud models when signed out without using a personal key", async () => {
    vi.stubGlobal("window", { mago: { account: { mode: "local" } } });
    listAll.mockResolvedValue(projectTreeWithImageOnlyContainerShot);
    submit.mockResolvedValue({ jobId: "job" });

    await expect(submitImageToVideoRender(seedance2I2vModel)).rejects.toThrow(
      "render provider is unavailable"
    );

    expect(submit).not.toHaveBeenCalled();
    expect(submitCloudImageToVideoRender).not.toHaveBeenCalled();
  });
});
