import { beforeEach, describe, expect, it, vi } from "vitest";

import { submitCloudImg2ImgRender } from "./submitCloudImg2ImgRender";

const makeBridge = () => {
  const links = new Map<
    string,
    { cloudId: string; data: Record<string, unknown> }
  >();
  const registered: Record<string, unknown>[] = [];
  return {
    links,
    registered,
    api: {
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
          register: vi.fn(),
          registerImage: vi.fn(async (input: Record<string, unknown>) => {
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

vi.mock("@/platform/localDesktop", () => ({
  isLocalApp: true,
  getLocalDesktopApi: () => bridge.api
}));

const PAYLOAD = {
  settings: {
    render_model: "nanobanana_pro",
    reference_images: ["local-reference"],
    prompt: "a cat",
    width: 1024,
    height: 1024
  },
  frame: 12,
  img_file_type: "jpg",
  render_mode: "credits",
  render_model: "nanobanana_pro",
  name: "Shot image 1"
};

const LOCAL = {
  projectId: "local-project",
  projectName: "Project",
  shotId: "local-shot",
  shotName: "Shot",
  assetId: "local-asset",
  assetName: "clip"
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
        if (url === "/assets/image/upload") {
          return {
            asset: { id: "cloud-reference" },
            s3_url: "https://bucket.s3.amazonaws.com/ref.png?sig=1"
          } as never;
        }
        if (url.endsWith("/ingestion")) return {} as never;
        if (url === "/assets/img2img/render") {
          return {
            id: "cloud-img2img-layer",
            timeline_id: "cloud-timeline",
            clips: [{ id: "cloud-clip", asset: { id: "cloud-output" } }]
          } as never;
        }
        throw new Error(`unexpected POST ${url}`);
      }),
      get: vi.fn(async (url: string) => {
        if (url.startsWith("/assets/")) {
          return { asset: { data: { status: "ingested" } } } as never;
        }
        throw new Error(`unexpected GET ${url}`);
      })
    }
  };
};

beforeEach(() => {
  bridge = makeBridge();
});

describe("submitCloudImg2ImgRender", () => {
  it("submits with cloud ids and records the job locally", async () => {
    const { api, posts } = makeApi();

    const result = await submitCloudImg2ImgRender(api, {
      payload: PAYLOAD,
      local: LOCAL
    });

    expect(result).toEqual({ jobId: "job-1", cloudAssetId: "cloud-output" });

    const render = posts.find((p) => p.url === "/assets/img2img/render");
    expect(render).toBeDefined();
    // The source is the mirrored *asset*, unlike a video render's sources.video
    // which is the mirrored layer.
    expect(render!.body.source_asset).toBe("cloud-asset");
    expect(render!.body.timeline_id).toBe("cloud-timeline");
    expect(render!.body.frame).toBe(12);
    expect(render!.body.render_model).toBe("nanobanana_pro");
  });

  it("mirrors reference images so the backend does not reject a local id", async () => {
    const { api, posts } = makeApi();

    await submitCloudImg2ImgRender(api, { payload: PAYLOAD, local: LOCAL });

    const render = posts.find((p) => p.url === "/assets/img2img/render")!;
    const settings = render.body.settings as Record<string, unknown>;
    expect(settings.reference_images).toEqual(["cloud-reference"]);
    expect(bridge.api.cloud.uploadAsset).toHaveBeenCalled();
  });

  it("never creates an output layer -- the backend makes its own", async () => {
    const { api, posts } = makeApi();

    await submitCloudImg2ImgRender(api, { payload: PAYLOAD, local: LOCAL });

    expect(posts.some((p) => p.url === "/layers")).toBe(false);
  });

  it("registers the job with the cloud ids and the frame", async () => {
    const { api } = makeApi();

    await submitCloudImg2ImgRender(api, { payload: PAYLOAD, local: LOCAL });

    expect(bridge.registered).toHaveLength(1);
    expect(bridge.registered[0]).toMatchObject({
      projectId: "local-project",
      shotId: "local-shot",
      sourceAssetId: "local-asset",
      model: "nanobanana_pro",
      frame: 12,
      cloudAssetId: "cloud-output",
      // The clip id, not just the asset id: img2img has no project-wide queue,
      // so GET /assets/img2img/status/{clipId} is the only way to learn when
      // this render finishes. Omitting it is what left a finished render
      // stuck forever, never polled again.
      cloudClipId: "cloud-clip"
    });
  });

  it("fails loudly when the response carries no output asset", async () => {
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
      if (url === "/assets/image/upload") {
        return {
          asset: { id: "cloud-reference" },
          s3_url: "https://bucket.s3.amazonaws.com/ref.png?sig=1"
        } as never;
      }
      if (url.endsWith("/ingestion")) return {} as never;
      // The shape that used to pass silently and leave an unpollable job.
      return { id: "cloud-layer", clips: [] } as never;
    });

    await expect(
      submitCloudImg2ImgRender(api, { payload: PAYLOAD, local: LOCAL })
    ).rejects.toThrow("did not return a render output asset");
    expect(bridge.registered).toHaveLength(0);
  });

  it("records the settings locally with their local image ids, so reuse can restore them", async () => {
    const { api } = makeApi();

    await submitCloudImg2ImgRender(api, { payload: PAYLOAD, local: LOCAL });

    expect(bridge.registered[0]?.settings).toEqual(PAYLOAD.settings);
  });

  it("sends the inline input image to the cloud but does not record it locally", async () => {
    const { api, posts } = makeApi();
    const inlineInputImage = "data:image/png;base64,AAAA";

    await submitCloudImg2ImgRender(api, {
      payload: {
        ...PAYLOAD,
        settings: { ...PAYLOAD.settings, input_image: inlineInputImage }
      },
      local: LOCAL
    });

    const render = posts.find((p) => p.url === "/assets/img2img/render")!;
    const sentSettings = render.body.settings as Record<string, unknown>;
    expect(sentSettings.input_image).toBe(inlineInputImage);
    expect(bridge.registered[0]?.settings).not.toHaveProperty("input_image");
  });
});
