import { RenderMode } from "@hooks/types";
import { seedance2I2vFastModel } from "@models/video/seedance2I2vFastModel";
import { seedance2I2vModel } from "@models/video/seedance2I2vModel";
import { VideoModelDefinition, VideoSettings } from "@models/video/types";
import { afterEach, describe, expect, it, vi } from "vitest";

const { submit, listAll, cloudSubmit } = vi.hoisted(() => ({
  submit: vi.fn(),
  cloudSubmit: vi.fn(),
  listAll: vi.fn()
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

vi.mock("@domains/cloud/submitCloudImageToVideoRender", () => ({
  submitCloudImageToVideoRender: cloudSubmit
}));

import { postRender } from "./postRender";

const outputTrack = { id: "i2v-output-track", name: "Image to Video" };

const submitImageToVideoRender = (model: VideoModelDefinition) =>
  postRender({
    parentLayerId: outputTrack.id,
    frameRange: [0, 119],
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

describe("postRender — a local Image-to-Video render", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  const magoCloudSwitchedOff = JSON.stringify({ "mago-cloud": false });

  it.each([
    { model: seedance2I2vModel, accountMode: "local", storedPreferences: null },
    {
      model: seedance2I2vModel,
      accountMode: "cloud",
      storedPreferences: magoCloudSwitchedOff
    },
    {
      model: seedance2I2vFastModel,
      accountMode: "local",
      storedPreferences: null
    },
    {
      model: seedance2I2vFastModel,
      accountMode: "cloud",
      storedPreferences: magoCloudSwitchedOff
    }
  ])(
    "submits $model.name ($accountMode account, provider preferences $storedPreferences) with the start and end images and no input track",
    async ({ model, accountMode, storedPreferences }) => {
      vi.stubGlobal("window", {
        mago: { account: { mode: accountMode } },
        localStorage: { getItem: () => storedPreferences }
      });
      submit.mockResolvedValue({ jobId: "job" });
      listAll.mockResolvedValue([
        {
          id: "project",
          timelines: [{ id: "container", layers: [outputTrack] }]
        }
      ]);

      if (accountMode === "cloud") {
        await expect(submitImageToVideoRender(model)).resolves.toEqual(
          outputTrack
        );
        expect(cloudSubmit).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            model: model.name,
            local: expect.objectContaining({
              projectId: "project",
              shotId: "container",
              outputTrackId: outputTrack.id
            }),
            payload: expect.objectContaining({
              sources: {},
              render_settings: {
                magov2: expect.objectContaining({
                  image_id: "start-image",
                  end_image_id: "end-image"
                })
              }
            })
          })
        );
      } else {
        await expect(submitImageToVideoRender(model)).rejects.toThrow(
          "render provider is unavailable"
        );
        expect(cloudSubmit).not.toHaveBeenCalled();
        expect(listAll).not.toHaveBeenCalled();
      }
      expect(submit).not.toHaveBeenCalled();
    }
  );
});
