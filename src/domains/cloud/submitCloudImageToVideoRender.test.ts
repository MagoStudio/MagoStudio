import { beforeEach, describe, expect, it, vi } from "vitest";

import { submitCloudImageToVideoRender } from "./submitCloudImageToVideoRender";

const makeBridge = () => {
  const links = new Map<
    string,
    { cloudId: string; data: Record<string, unknown> }
  >();
  const registered: unknown[] = [];
  return {
    links,
    registered,
    api: {
      projects: {
        listAll: vi.fn(async () => [
          {
            id: "local-project",
            timelines: [
              {
                id: "local-container-shot",
                layers: [{ id: "local-output-track", name: "Image to Video" }]
              }
            ]
          }
        ])
      },
      cloud: {
        links: {
          get: vi.fn(async (kind: string, localId: string) => {
            const found = links.get(`${kind}:${localId}`);
            return found
              ? {
                  kind,
                  localId,
                  cloudId: found.cloudId,
                  syncedAt: null,
                  data: found.data
                }
              : null;
          }),
          put: vi.fn(
            async (input: {
              kind: string;
              localId: string;
              cloudId: string;
              data?: Record<string, unknown>;
            }) => {
              links.set(`${input.kind}:${input.localId}`, {
                cloudId: input.cloudId,
                data: input.data ?? {}
              });
            }
          )
        },
        assetInfo: vi.fn(async (assetId: string) => ({
          id: assetId,
          name: assetId,
          extension: "png",
          width: 1280,
          height: 720,
          type: "image"
        })),
        uploadAsset: vi.fn(async () => undefined),
        prepareUpload: vi.fn(),
        uploadPrepared: vi.fn(),
        renders: {
          register: vi.fn(async (input: unknown) => {
            registered.push(input);
            return { jobId: "job-1", assetId: "local-out", clipId: "clip-1" };
          })
        }
      }
    }
  };
};

let bridge = makeBridge();

const isCloudProject = vi.hoisted(() => vi.fn(async () => false));

vi.mock("@domains/shot/utils/isCloudProject", () => ({ isCloudProject }));

vi.mock("@/platform/localDesktop", () => ({
  isLocalApp: true,
  getLocalDesktopApi: () => bridge.api
}));

const LOCAL_RENDER_SETTINGS = {
  mago_engine: "seedance_2_i2v",
  image_id: "local-start-image",
  end_image_id: "local-end-image",
  prompt: "a slow pan",
  durationInSeconds: 5,
  frameRangeSeconds: [0, 5],
  fps: 24,
  resolution: "720p",
  aspect_ratio: "auto",
  generate_audio: true,
  frame_range: [0, 120]
};

const PAYLOAD = {
  parent_layer_id: "local-output-track",
  frame_range: [0, 120],
  render_mode: "CREDITS",
  render_settings: { magov2: LOCAL_RENDER_SETTINGS },
  sources: {},
  render_engine: "magov2"
};

const LOCAL = {
  projectId: "local-project",
  projectName: "Project",
  shotId: "local-container-shot",
  shotName: "Image to Video",
  outputTrackId: "local-output-track"
};

const submitInput = () => ({
  payload: PAYLOAD,
  local: LOCAL,
  model: "seedance_2_i2v",
  fps: 24,
  frameRange: [0, 120] as [number, number]
});

const makeApi = (options: { rejectSubmit?: boolean } = {}) => {
  const posts: { url: string; body: Record<string, unknown> }[] = [];
  let uploadedImageCount = 0;
  return {
    posts,
    api: {
      post: vi.fn(async (url: string, body?: unknown) => {
        posts.push({ url, body: (body ?? {}) as Record<string, unknown> });
        if (url === "/projects") return { id: "cloud-project" } as never;
        if (url.startsWith("/timelines/"))
          return { id: "cloud-container-shot" } as never;
        if (url === "/assets/image/upload") {
          uploadedImageCount += 1;
          return {
            asset: { id: `cloud-image-${uploadedImageCount}` },
            s3_url: "https://bucket.s3.amazonaws.com/image.png?sig=1"
          } as never;
        }
        if (url === "/layers") return { id: "cloud-output-layer" } as never;
        if (url === "/assets/add_render") {
          if (options.rejectSubmit) throw new Error("Not enough credits");
          return {
            id: "cloud-output-layer",
            clips: [{ asset: { id: "cloud-render-asset" } }]
          } as never;
        }
        return {} as never;
      }),
      get: vi.fn(async () => ({}) as never)
    }
  };
};

const findPost = (
  posts: { url: string; body: Record<string, unknown> }[],
  url: string
) => posts.find((entry) => entry.url === url);

beforeEach(() => {
  bridge = makeBridge();
  isCloudProject.mockResolvedValue(false);
});

describe("submitCloudImageToVideoRender — a local project", () => {
  it("submits like the web app: a RENDER layer in the container shot, no sources, cloud image ids", async () => {
    const { api, posts } = makeApi();

    await submitCloudImageToVideoRender(api, submitInput());

    expect(findPost(posts, "/timelines/cloud-project")?.body).toEqual({
      name: "Image to Video"
    });
    expect(findPost(posts, "/layers")?.body).toEqual({
      timeline_id: "cloud-container-shot",
      type: "RENDER",
      name: "Image to Video",
      data: { renderEngine: "magov2" },
      parent_layer_order: 1
    });
    expect(findPost(posts, "/assets/add_render")?.body).toEqual({
      ...PAYLOAD,
      parent_layer_id: "cloud-output-layer",
      render_settings: {
        magov2: {
          ...LOCAL_RENDER_SETTINGS,
          image_id: "cloud-image-1",
          end_image_id: "cloud-image-2"
        }
      }
    });
  });

  it("uploads the start and end images into the mirrored project and never a video", async () => {
    const { api, posts } = makeApi();

    await submitCloudImageToVideoRender(api, submitInput());

    const imageUploads = posts.filter(
      (entry) => entry.url === "/assets/image/upload"
    );
    expect(imageUploads.map((entry) => entry.body)).toEqual([
      expect.objectContaining({
        name: "local-start-image",
        project_id: "cloud-project"
      }),
      expect.objectContaining({
        name: "local-end-image",
        project_id: "cloud-project"
      })
    ]);
    expect(findPost(posts, "/assets/video/upload")).toBeUndefined();
    expect(bridge.api.cloud.prepareUpload).not.toHaveBeenCalled();
    expect(api.get).not.toHaveBeenCalled();
  });

  it("registers the local rows against the start image, keeping the local image ids", async () => {
    const { api } = makeApi();

    const result = await submitCloudImageToVideoRender(api, submitInput());

    expect(result).toEqual({
      jobId: "job-1",
      cloudAssetId: "cloud-render-asset"
    });
    expect(bridge.registered).toEqual([
      {
        outputTrackId: "local-output-track",
        sourceAssetId: "local-start-image",
        model: "seedance_2_i2v",
        frameRange: [0, 120],
        fps: 24,
        cloudAssetId: "cloud-render-asset",
        cloudOutputLayerId: "cloud-output-layer",
        settings: LOCAL_RENDER_SETTINGS
      }
    ]);
  });

  it("deletes the output layer it created when the submit is rejected", async () => {
    const { api } = makeApi({ rejectSubmit: true });
    const removeCloudLayer = vi.fn(async () => undefined);

    await expect(
      submitCloudImageToVideoRender(api, submitInput(), removeCloudLayer)
    ).rejects.toThrow("Not enough credits");

    expect(removeCloudLayer).toHaveBeenCalledWith("cloud-output-layer");
    expect(bridge.registered).toEqual([]);
  });

  it("refuses a render with no start image before touching the cloud", async () => {
    const { api } = makeApi();

    await expect(
      submitCloudImageToVideoRender(api, {
        ...submitInput(),
        payload: {
          ...PAYLOAD,
          render_settings: {
            magov2: { ...LOCAL_RENDER_SETTINGS, image_id: undefined }
          }
        }
      })
    ).rejects.toThrow("Image-to-Video renders need a start image");

    expect(api.post).not.toHaveBeenCalled();
  });
});

describe("submitCloudImageToVideoRender — a cloud project", () => {
  beforeEach(() => {
    isCloudProject.mockResolvedValue(true);
    bridge.links.set("project:local-project", {
      cloudId: "local-project",
      data: {}
    });
    bridge.links.set("asset:local-start-image", {
      cloudId: "local-start-image",
      data: { status: "ingested", kind: "image" }
    });
  });

  it("renders into the output track that already lives in the cloud", async () => {
    const { api, posts } = makeApi();

    await submitCloudImageToVideoRender(api, {
      ...submitInput(),
      payload: {
        ...PAYLOAD,
        render_settings: {
          magov2: { ...LOCAL_RENDER_SETTINGS, end_image_id: undefined }
        }
      }
    });

    expect(findPost(posts, "/projects")).toBeUndefined();
    expect(findPost(posts, "/layers")).toBeUndefined();
    expect(
      posts.some((entry) => entry.url.startsWith("/timelines/"))
    ).toBeFalsy();
    expect(findPost(posts, "/assets/image/upload")).toBeUndefined();
    const submitted = findPost(posts, "/assets/add_render")?.body;
    expect(submitted?.parent_layer_id).toBe("local-output-track");
    expect(submitted?.sources).toEqual({});
  });
});
