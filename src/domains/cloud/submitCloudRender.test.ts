import { beforeEach, describe, expect, it, vi } from "vitest";

import { submitCloudRender } from "./submitCloudRender";

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
                id: "local-shot",
                layers: [
                  { id: "local-input-track", name: "clip" },
                  { id: "local-output-track", name: "clip_Upscale (2)" }
                ]
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
          ),
          patch: vi.fn(
            async (input: {
              kind: string;
              localId: string;
              patch: Record<string, unknown>;
            }) => {
              const key = `${input.kind}:${input.localId}`;
              const existing = links.get(key)!;
              links.set(key, {
                ...existing,
                data: { ...existing.data, ...input.patch }
              });
            }
          )
        },
        assetInfo: vi.fn(async (assetId: string) => ({
          id: assetId,
          name: "reference",
          extension: "png",
          width: 1024,
          height: 1024,
          type: "image"
        })),
        uploadAsset: vi.fn(async () => undefined),
        prepareUpload: vi.fn(async () => ({ sizeBytes: 1, encoded: true })),
        uploadPrepared: vi.fn(async () => undefined),
        onUploadProgress: vi.fn(() => () => undefined),
        renders: {
          register: vi.fn(async (input: unknown) => {
            registered.push(input);
            return { jobId: "job-1", assetId: "local-out", clipId: "clip-1" };
          }),
          listActive: vi.fn(async () => []),
          finish: vi.fn(),
          fail: vi.fn(),
          setStatus: vi.fn()
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

const PAYLOAD = {
  parent_layer_id: "placeholder",
  frame_range: [0, 40],
  render_mode: "credits",
  render_settings: { magov2: { mago_engine: "v8.0.0", resolution: 700 } },
  sources: {},
  render_engine: "magov2"
};

const LOCAL = {
  projectId: "local-project",
  projectName: "Project",
  shotId: "local-shot",
  shotName: "Shot",
  assetId: "local-asset",
  assetName: "clip",
  outputTrackId: "local-output-track"
};

const makeApi = () => {
  const posts: { url: string; body: Record<string, unknown> }[] = [];
  return {
    posts,
    api: {
      post: vi.fn(async (url: string, body?: unknown) => {
        posts.push({ url, body: (body ?? {}) as Record<string, unknown> });
        if (url === "/projects") return { id: "cloud-project" } as never;
        if (url.startsWith("/timelines/"))
          return { id: "cloud-timeline" } as never;
        if (url === "/assets/video/upload") {
          return {
            video_url: "https://bucket.s3.amazonaws.com/in.mp4?sig=1",
            timeline: {
              layers: [
                {
                  id: "cloud-input-layer",
                  clips: [{ asset: { id: "cloud-asset" } }]
                }
              ]
            }
          } as never;
        }
        if (url === "/layers") return { id: "cloud-output-layer" } as never;
        if (url === "/assets/add_render") {
          return {
            id: "cloud-output-layer",
            clips: [{ asset: { id: "cloud-render-asset" } }]
          } as never;
        }
        return {} as never;
      }),
      get: vi.fn(
        async () => ({ asset: { data: { status: "ingested" } } }) as never
      )
    }
  };
};

beforeEach(() => {
  bridge = makeBridge();
  isCloudProject.mockResolvedValue(false);
});

describe("submitCloudRender", () => {
  it("creates the output layer as type RENDER", async () => {
    // An unrecognised type is silently coerced to IMAGE by the backend, which
    // renders wrongly in the cloud web app with no error.
    const { api, posts } = makeApi();

    await submitCloudRender(api, {
      payload: PAYLOAD,
      local: LOCAL,
      model: "v8.0.0",
      fps: 24,
      frameRange: [0, 40]
    });

    const layerPost = posts.find((entry) => entry.url === "/layers");
    expect(layerPost?.body.type).toBe("RENDER");
    expect(layerPost?.body.timeline_id).toBe("cloud-timeline");
  });

  it("submits against the fresh output layer, not the placeholder", async () => {
    // add_render rejects a parent layer that already holds a clip.
    const { api, posts } = makeApi();

    await submitCloudRender(api, {
      payload: PAYLOAD,
      local: LOCAL,
      model: "v8.0.0",
      fps: 24,
      frameRange: [0, 40]
    });

    const render = posts.find((entry) => entry.url === "/assets/add_render");
    expect(render?.body.parent_layer_id).toBe("cloud-output-layer");
  });

  it("points the render at the mirrored input layer", async () => {
    const { api, posts } = makeApi();

    await submitCloudRender(api, {
      payload: PAYLOAD,
      local: LOCAL,
      model: "v8.0.0",
      fps: 24,
      frameRange: [0, 40]
    });

    const render = posts.find((entry) => entry.url === "/assets/add_render");
    expect(render?.body.sources).toEqual({ video: "cloud-input-layer" });
  });

  it("registers the local rows with the cloud output asset", async () => {
    const { api } = makeApi();

    const result = await submitCloudRender(api, {
      payload: PAYLOAD,
      local: LOCAL,
      model: "v8.0.0",
      fps: 24,
      frameRange: [0, 40]
    });

    expect(result).toEqual({
      jobId: "job-1",
      cloudAssetId: "cloud-render-asset"
    });
    expect(bridge.registered).toEqual([
      {
        outputTrackId: "local-output-track",
        sourceAssetId: "local-asset",
        model: "v8.0.0",
        frameRange: [0, 40],
        fps: 24,
        cloudAssetId: "cloud-render-asset",
        cloudOutputLayerId: "cloud-output-layer",
        settings: PAYLOAD.render_settings.magov2,
        sources: {}
      }
    ]);
  });

  it("passes the trim through to the upload encode", async () => {
    const { api } = makeApi();

    await submitCloudRender(api, {
      payload: PAYLOAD,
      local: { ...LOCAL, trimStartSeconds: 1, trimEndSeconds: 3 },
      model: "v8.0.0",
      fps: 24,
      frameRange: [0, 40]
    });

    expect(bridge.api.cloud.prepareUpload).toHaveBeenCalledWith({
      assetId: "local-asset",
      trimStartSeconds: 1,
      trimEndSeconds: 3
    });
  });

  it("mirrors reference images and submits their cloud ids", async () => {
    // Local asset ids in sources are rejected with "Invalid source 'images':
    // asset not found or inaccessible".
    const { api, posts } = makeApi();
    api.post = vi.fn(async (url: string, body?: unknown) => {
      posts.push({ url, body: (body ?? {}) as Record<string, unknown> });
      if (url === "/projects") return { id: "cloud-project" } as never;
      if (url.startsWith("/timelines/"))
        return { id: "cloud-timeline" } as never;
      if (url === "/assets/video/upload") {
        return {
          video_url: "https://bucket.s3.amazonaws.com/in.mp4?sig=1",
          timeline: {
            layers: [
              {
                id: "cloud-input-layer",
                clips: [{ asset: { id: "cloud-asset" } }]
              }
            ]
          }
        } as never;
      }
      if (url === "/assets/image/upload") {
        return {
          asset: { id: "cloud-image" },
          s3_url: "https://bucket.s3.amazonaws.com/ref.png?sig=1"
        } as never;
      }
      if (url === "/layers") return { id: "cloud-output-layer" } as never;
      if (url === "/assets/add_render") {
        return {
          clips: [{ asset: { id: "cloud-render-asset" } }]
        } as never;
      }
      return {} as never;
    });

    await submitCloudRender(api, {
      payload: {
        ...PAYLOAD,
        sources: {
          images: [{ asset_id: "local-reference", type: "reference_frame" }]
        }
      },
      local: LOCAL,
      model: "v8.0.0",
      fps: 24,
      frameRange: [0, 40]
    });

    expect(bridge.api.cloud.uploadAsset).toHaveBeenCalledWith({
      assetId: "local-reference",
      presignedUrl: "https://bucket.s3.amazonaws.com/ref.png?sig=1"
    });
    const render = posts.find((entry) => entry.url === "/assets/add_render");
    expect(render?.body.sources).toEqual({
      video: "cloud-input-layer",
      images: [{ asset_id: "cloud-image", type: "reference_frame" }]
    });
  });

  it("records the reference images locally with their local ids, so reuse can restore them", async () => {
    const { api } = makeApi();
    const basePost = api.post;
    api.post = vi.fn(async (url: string, body?: unknown) => {
      if (url === "/assets/image/upload") {
        return {
          asset: { id: "cloud-image" },
          s3_url: "https://bucket.s3.amazonaws.com/ref.png?sig=1"
        } as never;
      }
      return basePost(url, body);
    });

    await submitCloudRender(api, {
      payload: {
        ...PAYLOAD,
        sources: {
          images: [{ asset_id: "local-reference", type: "reference_frame" }]
        }
      },
      local: LOCAL,
      model: "v8.0.0",
      fps: 24,
      frameRange: [0, 40]
    });

    expect(bridge.registered).toEqual([
      expect.objectContaining({
        sources: {
          images: [{ asset_id: "local-reference", type: "reference_frame" }]
        }
      })
    ]);
  });

  it("refuses to submit when the render output cannot be identified", async () => {
    const { api } = makeApi();
    api.post = vi.fn(async (url: string) => {
      if (url === "/projects") return { id: "cloud-project" } as never;
      if (url.startsWith("/timelines/"))
        return { id: "cloud-timeline" } as never;
      if (url === "/assets/video/upload") {
        return {
          video_url: "https://bucket.s3.amazonaws.com/in.mp4?sig=1",
          timeline: {
            layers: [
              {
                id: "cloud-input-layer",
                clips: [{ asset: { id: "cloud-asset" } }]
              }
            ]
          }
        } as never;
      }
      if (url === "/layers") return { id: "cloud-output-layer" } as never;
      return { clips: [] } as never;
    });

    await expect(
      submitCloudRender(api, {
        payload: PAYLOAD,
        local: LOCAL,
        model: "v8.0.0",
        fps: 24,
        frameRange: [0, 40]
      })
    ).rejects.toThrow(/render output asset/);
    // Nothing local was created for a submission that produced nothing.
    expect(bridge.registered).toEqual([]);
  });

  it("refuses when the mirrored video has no layer to render from", async () => {
    const { api } = makeApi();
    api.post = vi.fn(async (url: string) => {
      if (url === "/projects") return { id: "cloud-project" } as never;
      if (url.startsWith("/timelines/"))
        return { id: "cloud-timeline" } as never;
      if (url === "/assets/video/upload") {
        // No layer id in the response.
        return {
          video_url: "https://bucket.s3.amazonaws.com/in.mp4?sig=1",
          timeline: { layers: [{ clips: [{ asset: { id: "cloud-asset" } }] }] }
        } as never;
      }
      return {} as never;
    });

    await expect(
      submitCloudRender(api, {
        payload: PAYLOAD,
        local: LOCAL,
        model: "v8.0.0",
        fps: 24,
        frameRange: [0, 40]
      })
    ).rejects.toThrow(/no cloud layer/);
  });

  it("names the output layer like the local output track and places it after the source", async () => {
    const { api: baseApi, posts } = makeApi();
    const api = {
      ...baseApi,
      get: vi.fn(async (url: string) =>
        url === "/layers/cloud-input-layer"
          ? ({ id: "cloud-input-layer", layer_order: 3 } as never)
          : ({ asset: { data: { status: "ingested" } } } as never)
      )
    };

    await submitCloudRender(api, {
      payload: PAYLOAD,
      local: LOCAL,
      model: "v2.0.0-esrgan-upscaler",
      fps: 24,
      frameRange: [0, 40]
    });

    const layerPost = posts.find((entry) => entry.url === "/layers");
    expect(layerPost?.body.name).toBe("clip_Upscale (2)");
    expect(layerPost?.body.parent_layer_order).toBe(3);
  });

  it("falls back to the shot name and order 1 when nothing better is known", async () => {
    const { api, posts } = makeApi();
    bridge.api.projects.listAll.mockResolvedValueOnce([]);

    await submitCloudRender(api, {
      payload: PAYLOAD,
      local: LOCAL,
      model: "v8.0.0",
      fps: 24,
      frameRange: [0, 40]
    });

    const layerPost = posts.find((entry) => entry.url === "/layers");
    expect(layerPost?.body.name).toBe("Shot");
    expect(layerPost?.body.parent_layer_order).toBe(1);
  });

  it("deletes the output layer and rethrows when add_render fails", async () => {
    const { api } = makeApi();
    const basePost = api.post;
    const refusal = Object.assign(new Error("Payment Required"), {
      response: { status: 402, data: { message: "Insufficient balance" } }
    });
    api.post = vi.fn(async (url: string, body?: unknown) => {
      if (url === "/assets/add_render") throw refusal;
      return basePost(url, body);
    });
    const removeCloudLayer = vi.fn(async () => undefined);

    await expect(
      submitCloudRender(
        api,
        {
          payload: PAYLOAD,
          local: LOCAL,
          model: "v8.0.0",
          fps: 24,
          frameRange: [0, 40]
        },
        removeCloudLayer
      )
    ).rejects.toBe(refusal);
    expect(removeCloudLayer).toHaveBeenCalledWith("cloud-output-layer");
    expect(bridge.registered).toEqual([]);
  });

  it("still reports the submit failure when the cleanup delete fails too", async () => {
    const { api } = makeApi();
    const basePost = api.post;
    const refusal = new Error("add_render refused");
    api.post = vi.fn(async (url: string, body?: unknown) => {
      if (url === "/assets/add_render") throw refusal;
      return basePost(url, body);
    });
    const removeCloudLayer = vi.fn(async () => {
      throw new Error("delete failed");
    });

    await expect(
      submitCloudRender(
        api,
        {
          payload: PAYLOAD,
          local: LOCAL,
          model: "v8.0.0",
          fps: 24,
          frameRange: [0, 40]
        },
        removeCloudLayer
      )
    ).rejects.toBe(refusal);
  });

  it("renders into the track a cloud project already created in the cloud", async () => {
    isCloudProject.mockResolvedValue(true);
    const { api, posts } = makeApi();

    await submitCloudRender(api, {
      payload: PAYLOAD,
      local: LOCAL,
      model: "v8.0.0",
      fps: 24,
      frameRange: [0, 40]
    });

    expect(isCloudProject).toHaveBeenCalledWith("local-project");
    expect(posts.some((entry) => entry.url === "/layers")).toBe(false);
    const render = posts.find((entry) => entry.url === "/assets/add_render");
    expect(render?.body.parent_layer_id).toBe("local-output-track");
    expect(bridge.registered).toEqual([
      expect.objectContaining({ cloudOutputLayerId: "local-output-track" })
    ]);
  });

  it("keeps a clamped seedance 2.5 range within prod's durationInSeconds * fps check", async () => {
    const fps = 24;
    const requestedFrameRange: [number, number] = [0, 75];
    const seedancePayload = {
      ...PAYLOAD,
      frame_range: requestedFrameRange,
      render_settings: {
        magov2: {
          mago_engine: "seedance_2_5",
          fps,
          frame_range: requestedFrameRange,
          durationInSeconds: 76 / fps,
          frameRangeSeconds: [0, 75 / fps]
        }
      }
    };
    bridge.api.cloud.assetInfo.mockImplementation(async (assetId: string) => ({
      id: assetId,
      name: "clip",
      extension: "mp4",
      width: 1280,
      height: 720,
      type: "video",
      frameCount: 75
    }));
    const { api, posts } = makeApi();

    await submitCloudRender(api, {
      payload: seedancePayload,
      local: LOCAL,
      model: "seedance_2_5",
      fps,
      frameRange: requestedFrameRange
    });

    const render = posts.find((entry) => entry.url === "/assets/add_render");
    if (!render) throw new Error("add_render was not posted");
    const submittedFrameRange = render.body.frame_range as number[];
    const submittedSettings = (
      render.body.render_settings as { magov2: Record<string, unknown> }
    ).magov2;
    const submittedDurationInSeconds =
      submittedSettings.durationInSeconds as number;
    const backendFrameRangeMismatch = Math.abs(
      submittedFrameRange[1] -
        submittedFrameRange[0] -
        Math.round(submittedDurationInSeconds * fps)
    );
    expect(submittedFrameRange).toEqual([0, 74]);
    expect(backendFrameRangeMismatch).toBeLessThanOrEqual(1);
    expect(submittedSettings.durationInSeconds).toBe(75 / fps);
    expect(submittedSettings.frameRangeSeconds).toEqual([0, 74 / fps]);
    expect(bridge.registered).toEqual([
      expect.objectContaining({
        frameRange: [0, 74],
        settings: expect.objectContaining({
          durationInSeconds: 75 / fps,
          frame_range: [0, 74]
        })
      })
    ]);
  });

  it("keeps a cloud project's own track when add_render fails", async () => {
    isCloudProject.mockResolvedValue(true);
    const { api } = makeApi();
    const basePost = api.post;
    const refusal = new Error("add_render refused");
    api.post = vi.fn(async (url: string, body?: unknown) => {
      if (url === "/assets/add_render") throw refusal;
      return basePost(url, body);
    });
    const removeCloudLayer = vi.fn(async () => undefined);

    await expect(
      submitCloudRender(
        api,
        {
          payload: PAYLOAD,
          local: LOCAL,
          model: "v8.0.0",
          fps: 24,
          frameRange: [0, 40]
        },
        removeCloudLayer
      )
    ).rejects.toBe(refusal);
    expect(removeCloudLayer).not.toHaveBeenCalled();
  });
});
