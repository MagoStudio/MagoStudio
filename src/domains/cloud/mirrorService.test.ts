import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ensureCloudAsset,
  ensureCloudImageAsset,
  ensureCloudProject,
  ensureCloudTimeline,
  ensureMirroredShot,
  waitForIngestion
} from "./mirrorService";

/** Stands in for the cloud_links table and the main-process upload path. */
const makeBridge = () => {
  const links = new Map<
    string,
    { cloudId: string; data: Record<string, unknown> }
  >();
  const calls: string[] = [];
  return {
    calls,
    links,
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
              const existing = links.get(key);
              if (!existing) throw new Error("no link");
              links.set(key, {
                ...existing,
                data: { ...existing.data, ...input.patch }
              });
            }
          )
        },
        prepareUpload: vi.fn(async () => {
          calls.push("prepareUpload");
          return { sizeBytes: 1024, encoded: true };
        }),
        uploadPrepared: vi.fn(async () => {
          calls.push("uploadPrepared");
        }),
        onUploadProgress: vi.fn(() => () => undefined),
        assetInfo: vi.fn(
          async (
            assetId: string
          ): Promise<{
            id: string;
            name: string;
            extension: string;
            width: number | null;
            height: number | null;
            type: string;
            sizeBytes: number | null;
            frameCount: number | null;
          }> => ({
            id: assetId,
            name: "reference",
            extension: "png",
            width: 512,
            height: 512,
            type: "image",
            sizeBytes: 1024,
            frameCount: null
          })
        ),
        uploadAsset: vi.fn(async () => {
          calls.push("uploadAsset");
        })
      }
    }
  };
};

let bridge = makeBridge();

vi.mock("@/platform/localDesktop", () => ({
  isLocalApp: true,
  getLocalDesktopApi: () => bridge.api
}));

const uploadResponse = (assetId: string) => ({
  video_url: "https://bucket.s3.amazonaws.com/key?sig=1",
  meta_url: "https://bucket.s3.amazonaws.com/meta?sig=1",
  timeline: {
    id: "cloud-timeline",
    layers: [{ id: "cloud-layer", clips: [{ asset: { id: assetId } }] }]
  }
});

const makeApi = (
  handlers: {
    post?: (url: string, body?: unknown) => unknown;
    get?: (url: string) => unknown;
  } = {}
) => {
  const posts: { url: string; body?: unknown }[] = [];
  const gets: string[] = [];
  return {
    posts,
    gets,
    api: {
      post: vi.fn(async (url: string, body?: unknown) => {
        posts.push({ url, body });
        return (handlers.post?.(url, body) ?? {}) as never;
      }),
      get: vi.fn(async (url: string) => {
        gets.push(url);
        return (handlers.get?.(url) ?? {}) as never;
      })
    }
  };
};

const notFoundError = () =>
  new AxiosError("Not found", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 404,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {}
  });

beforeEach(() => {
  bridge = makeBridge();
});

describe("ensureCloudProject", () => {
  it("creates a cloud project and remembers the mapping", async () => {
    const { api, posts } = makeApi({ post: () => ({ id: "cloud-project" }) });

    const id = await ensureCloudProject(api, {
      localProjectId: "local-project",
      name: "My project"
    });

    expect(id).toBe("cloud-project");
    expect(posts[0]?.url).toBe("/projects");
    expect(bridge.links.get("project:local-project")?.cloudId).toBe(
      "cloud-project"
    );
  });

  it("reuses the mapping instead of creating a second cloud project", async () => {
    const { api, posts } = makeApi({ post: () => ({ id: "cloud-project" }) });
    await ensureCloudProject(api, {
      localProjectId: "local-project",
      name: "My project"
    });

    const again = await ensureCloudProject(api, {
      localProjectId: "local-project",
      name: "My project"
    });

    expect(again).toBe("cloud-project");
    expect(posts).toHaveLength(1);
  });

  it("marks the cloud project as the mirror of its local project", async () => {
    const { api, posts } = makeApi({ post: () => ({ id: "cloud-project" }) });

    await ensureCloudProject(api, {
      localProjectId: "local-project",
      name: "My project"
    });

    expect(posts[0]?.body).toMatchObject({
      settings: { mirroredLocalProjectId: "local-project" }
    });
    expect(bridge.links.get("project:local-project")?.data).toMatchObject({
      isCloudProjectMarkedAsMirror: true
    });
  });

  it("creates one cloud project when two renders start at once", async () => {
    const { api, posts } = makeApi({ post: () => ({ id: "cloud-project" }) });

    const [first, second] = await Promise.all([
      ensureCloudProject(api, {
        localProjectId: "local-project",
        name: "My project"
      }),
      ensureCloudProject(api, {
        localProjectId: "local-project",
        name: "My project"
      })
    ]);

    expect(first).toBe("cloud-project");
    expect(second).toBe("cloud-project");
    expect(posts).toHaveLength(1);
  });

  it("tries again after a failed creation", async () => {
    let attempts = 0;
    const { api } = makeApi({
      post: () => (++attempts === 1 ? {} : { id: "cloud-project" })
    });

    await expect(
      ensureCloudProject(api, { localProjectId: "l", name: "n" })
    ).rejects.toThrow(/project id/);

    await expect(
      ensureCloudProject(api, { localProjectId: "l", name: "n" })
    ).resolves.toBe("cloud-project");
  });

  it("replaces a linked cloud project the cloud no longer has", async () => {
    await bridge.api.cloud.links.put({
      kind: "project",
      localId: "local-with-deleted-mirror",
      cloudId: "deleted-mirror"
    });
    const { api, posts, gets } = makeApi({
      get: (url) => {
        if (url === "/projects/deleted-mirror") throw notFoundError();
        return {};
      },
      post: () => ({ id: "replacement-mirror" })
    });

    const id = await ensureCloudProject(api, {
      localProjectId: "local-with-deleted-mirror",
      name: "My project"
    });

    expect(gets).toEqual(["/projects/deleted-mirror"]);
    expect(id).toBe("replacement-mirror");
    expect(posts[0]?.url).toBe("/projects");
    expect(bridge.links.get("project:local-with-deleted-mirror")?.cloudId).toBe(
      "replacement-mirror"
    );
  });

  it("checks a linked cloud project only once per run", async () => {
    await bridge.api.cloud.links.put({
      kind: "project",
      localId: "local-with-live-mirror",
      cloudId: "live-mirror"
    });
    const { api, posts, gets } = makeApi({
      get: () => ({ id: "live-mirror" })
    });
    const input = { localProjectId: "local-with-live-mirror", name: "n" };

    await expect(ensureCloudProject(api, input)).resolves.toBe("live-mirror");
    await expect(ensureCloudProject(api, input)).resolves.toBe("live-mirror");

    expect(gets).toEqual(["/projects/live-mirror"]);
    expect(posts).toHaveLength(0);
  });

  it("keeps the link when the cloud cannot be reached", async () => {
    await bridge.api.cloud.links.put({
      kind: "project",
      localId: "local-offline",
      cloudId: "mirror-offline"
    });
    const { api, posts } = makeApi({
      get: () => {
        throw new Error("Network Error");
      }
    });

    await expect(
      ensureCloudProject(api, { localProjectId: "local-offline", name: "n" })
    ).rejects.toThrow(/Network Error/);
    expect(posts).toHaveLength(0);
    expect(bridge.links.get("project:local-offline")?.cloudId).toBe(
      "mirror-offline"
    );
  });

  it("fails loudly when the cloud returns no id", async () => {
    const { api } = makeApi({ post: () => ({}) });

    await expect(
      ensureCloudProject(api, { localProjectId: "l", name: "n" })
    ).rejects.toThrow(/project id/);
  });
});

describe("ensureCloudTimeline", () => {
  it("creates a timeline under the cloud project and caches it", async () => {
    const { api, posts } = makeApi({ post: () => ({ id: "cloud-timeline" }) });

    const id = await ensureCloudTimeline(api, {
      localShotId: "local-shot",
      cloudProjectId: "cloud-project",
      name: "Shot 1"
    });

    expect(id).toBe("cloud-timeline");
    expect(posts[0]?.url).toBe("/timelines/cloud-project");
    expect(posts[0]?.body).toEqual({ name: "Shot 1" });
  });

  it("adopts the timeline that came free with the project", async () => {
    // POST /projects creates an empty timeline; creating a second one would leave
    // an orphan empty shot visible in the cloud web app.
    const { api, posts } = makeApi({
      post: (url) =>
        url === "/projects"
          ? { id: "cloud-project", timelines: [{ id: "free-timeline" }] }
          : { id: "created-timeline" }
    });
    await ensureCloudProject(api, {
      localProjectId: "local-project",
      name: "Project"
    });

    const id = await ensureCloudTimeline(api, {
      localShotId: "local-shot",
      localProjectId: "local-project",
      cloudProjectId: "cloud-project",
      name: "Shot 1"
    });

    expect(id).toBe("free-timeline");
    expect(posts.map((entry) => entry.url)).toEqual(["/projects"]);
  });

  it("adopts the free timeline only once, then creates more", async () => {
    const { api, posts } = makeApi({
      post: (url) =>
        url === "/projects"
          ? { id: "cloud-project", timelines: [{ id: "free-timeline" }] }
          : { id: "created-timeline" }
    });
    await ensureCloudProject(api, {
      localProjectId: "local-project",
      name: "Project"
    });
    const base = {
      localProjectId: "local-project",
      cloudProjectId: "cloud-project",
      name: "Shot"
    };

    const first = await ensureCloudTimeline(api, {
      ...base,
      localShotId: "shot-1"
    });
    const second = await ensureCloudTimeline(api, {
      ...base,
      localShotId: "shot-2"
    });

    expect(first).toBe("free-timeline");
    expect(second).toBe("created-timeline");
    expect(
      posts.filter((entry) => entry.url.startsWith("/timelines/"))
    ).toHaveLength(1);
  });

  it("reuses a cached timeline", async () => {
    const { api, posts } = makeApi({ post: () => ({ id: "cloud-timeline" }) });
    const input = {
      localShotId: "local-shot",
      cloudProjectId: "cloud-project",
      name: "Shot 1"
    };
    await ensureCloudTimeline(api, input);
    await ensureCloudTimeline(api, input);

    expect(posts).toHaveLength(1);
  });
});

describe("ensureCloudTimeline with a cached link", () => {
  it("replaces a cached timeline the cloud no longer has", async () => {
    await bridge.api.cloud.links.put({
      kind: "timeline",
      localId: "shot-with-deleted-timeline",
      cloudId: "deleted-timeline"
    });
    const { api, posts } = makeApi({
      get: () => {
        throw notFoundError();
      },
      post: () => ({ id: "replacement-timeline" })
    });

    const id = await ensureCloudTimeline(api, {
      localShotId: "shot-with-deleted-timeline",
      cloudProjectId: "mirror-a",
      name: "Shot 1"
    });

    expect(id).toBe("replacement-timeline");
    expect(posts[0]?.url).toBe("/timelines/mirror-a");
    expect(
      bridge.links.get("timeline:shot-with-deleted-timeline")?.cloudId
    ).toBe("replacement-timeline");
  });

  it("replaces a cached timeline that belongs to another cloud project", async () => {
    await bridge.api.cloud.links.put({
      kind: "timeline",
      localId: "shot-in-replaced-mirror",
      cloudId: "timeline-in-old-mirror"
    });
    const { api, posts } = makeApi({
      get: () => ({ id: "timeline-in-old-mirror", project_id: "old-mirror" }),
      post: () => ({ id: "timeline-in-new-mirror" })
    });

    const id = await ensureCloudTimeline(api, {
      localShotId: "shot-in-replaced-mirror",
      cloudProjectId: "new-mirror",
      name: "Shot 1"
    });

    expect(id).toBe("timeline-in-new-mirror");
    expect(posts[0]?.url).toBe("/timelines/new-mirror");
  });

  it("keeps a cached timeline that is still in its cloud project, checking once per run", async () => {
    await bridge.api.cloud.links.put({
      kind: "timeline",
      localId: "shot-with-live-timeline",
      cloudId: "live-timeline"
    });
    const { api, posts, gets } = makeApi({
      get: () => ({ id: "live-timeline", project_id: "mirror-b" })
    });
    const input = {
      localShotId: "shot-with-live-timeline",
      cloudProjectId: "mirror-b",
      name: "Shot 1"
    };

    await expect(ensureCloudTimeline(api, input)).resolves.toBe(
      "live-timeline"
    );
    await expect(ensureCloudTimeline(api, input)).resolves.toBe(
      "live-timeline"
    );

    expect(gets).toEqual(["/timeline/live-timeline"]);
    expect(posts).toHaveLength(0);
  });
});

describe("ensureCloudAsset", () => {
  const ingestedGet = () => ({ asset: { data: { status: "ingested" } } });

  it("encodes, registers, uploads, ingests and waits, in that order", async () => {
    const { api, posts } = makeApi({
      post: (url) => {
        bridge.calls.push(url);
        return url === "/assets/video/upload"
          ? uploadResponse("cloud-asset")
          : {};
      },
      get: ingestedGet
    });

    const id = await ensureCloudAsset(api, {
      localShotId: "local-shot",
      localAssetId: "local-asset",
      cloudTimelineId: "cloud-timeline",
      name: "clip"
    });

    expect(id).toBe("cloud-asset");
    expect(posts.map((entry) => entry.url)).toEqual([
      "/assets/video/upload",
      "/assets/cloud-asset/ingestion"
    ]);
    expect(bridge.calls).toEqual([
      "prepareUpload",
      "/assets/video/upload",
      "uploadPrepared",
      "/assets/cloud-asset/ingestion"
    ]);
  });

  it("signs the upload URL only after a long encode has finished", async () => {
    const presignedUrlLifetimeMs = 60 * 60 * 1000;
    let clockMs = 0;
    let uploadUrlSignedAtMs: number | null = null;
    bridge.api.cloud.prepareUpload.mockImplementation(async () => {
      clockMs += presignedUrlLifetimeMs + 1;
      return { sizeBytes: 1024, encoded: true };
    });
    bridge.api.cloud.uploadPrepared.mockImplementation(async () => {
      const uploadUrlAgeMs = clockMs - (uploadUrlSignedAtMs ?? -Infinity);
      if (uploadUrlAgeMs > presignedUrlLifetimeMs) {
        throw new Error("Request failed with status code 403");
      }
    });
    const { api } = makeApi({
      post: (url) => {
        if (url !== "/assets/video/upload") return {};
        uploadUrlSignedAtMs = clockMs;
        return uploadResponse("cloud-asset");
      },
      get: ingestedGet
    });

    await expect(
      ensureCloudAsset(api, {
        localShotId: "local-shot",
        localAssetId: "local-asset",
        cloudTimelineId: "cloud-timeline",
        name: "clip"
      })
    ).resolves.toBe("cloud-asset");
  });

  it("never writes the metadata file, which would trim a second time", async () => {
    const { api, posts } = makeApi({
      post: (url) =>
        url === "/assets/video/upload" ? uploadResponse("cloud-asset") : {},
      get: ingestedGet
    });

    await ensureCloudAsset(api, {
      localShotId: "local-shot",
      localAssetId: "local-asset",
      cloudTimelineId: "cloud-timeline",
      name: "clip",
      trimStartSeconds: 1,
      trimEndSeconds: 3
    });

    // The trim goes to ffmpeg, not to the cloud.
    expect(bridge.api.cloud.prepareUpload).toHaveBeenCalledWith({
      assetId: "local-asset",
      trimStartSeconds: 1,
      trimEndSeconds: 3
    });
    const uploadedUrls = posts.map((entry) => entry.url);
    expect(uploadedUrls).not.toContain("meta_url");
    expect(bridge.api.cloud.uploadPrepared).toHaveBeenCalledWith({
      assetId: "local-asset",
      trimStartSeconds: 1,
      trimEndSeconds: 3,
      presignedUrl: "https://bucket.s3.amazonaws.com/key?sig=1"
    });
  });

  it("skips everything when the shot's source is already ingested on its cloud timeline", async () => {
    await bridge.api.cloud.links.put({
      kind: "asset",
      localId: "local-asset#shot-local-shot#trim-full",
      cloudId: "cloud-asset",
      data: {
        status: "ingested",
        sourceVideoTrimKey: "full",
        cloudTimelineId: "cloud-timeline"
      }
    });
    const { api, posts } = makeApi();

    const id = await ensureCloudAsset(api, {
      localShotId: "local-shot",
      localAssetId: "local-asset",
      cloudTimelineId: "cloud-timeline",
      name: "clip"
    });

    expect(id).toBe("cloud-asset");
    expect(posts).toHaveLength(0);
    expect(bridge.calls).toEqual([]);
  });

  it("never re-uploads an asset that came from a cloud project", async () => {
    await bridge.api.cloud.links.put({
      kind: "asset",
      localId: "cloud-source",
      cloudId: "cloud-source",
      data: { origin: "cloud" }
    });
    const { api, posts } = makeApi();

    await expect(
      ensureCloudAsset(api, {
        localShotId: "local-shot",
        localAssetId: "cloud-source",
        cloudTimelineId: "cloud-timeline",
        name: "clip"
      })
    ).resolves.toBe("cloud-source");
    expect(posts).toHaveLength(0);
    expect(bridge.calls).toEqual([]);
  });

  it("re-runs a half-finished mirror rather than trusting it", async () => {
    // An upload interrupted before ingestion finished must not be rendered.
    await bridge.api.cloud.links.put({
      kind: "asset",
      localId: "local-asset#shot-local-shot#trim-full",
      cloudId: "stale-asset",
      data: {
        status: "uploading",
        sourceVideoTrimKey: "full",
        cloudTimelineId: "cloud-timeline"
      }
    });
    const { api } = makeApi({
      post: (url) =>
        url === "/assets/video/upload" ? uploadResponse("fresh-asset") : {},
      get: () => ({ asset: { data: { status: "ingested" } } })
    });

    const id = await ensureCloudAsset(api, {
      localShotId: "local-shot",
      localAssetId: "local-asset",
      cloudTimelineId: "cloud-timeline",
      name: "clip"
    });

    expect(id).toBe("fresh-asset");
    expect(
      bridge.links.get("asset:local-asset#shot-local-shot#trim-full")?.data
        .status
    ).toBe("ingested");
  });

  it("fails when the cloud response has no uploadable asset", async () => {
    const { api } = makeApi({
      post: () => ({ timeline: { layers: [] } })
    });

    await expect(
      ensureCloudAsset(api, {
        localShotId: "local-shot",
        localAssetId: "local-asset",
        cloudTimelineId: "cloud-timeline",
        name: "clip"
      })
    ).rejects.toThrow(/no asset id.*response keys: timeline/);
  });

  it("recognizes the backend's timeline-only occupied response", async () => {
    const registration = uploadResponse("cloud-asset");
    const { video_url: _videoUrl, ...timelineOnly } = registration;
    const { api, gets } = makeApi({
      post: () => timelineOnly
    });

    await expect(
      ensureCloudAsset(api, {
        localShotId: "local-shot",
        localAssetId: "local-asset",
        cloudTimelineId: "cloud-timeline",
        name: "clip"
      })
    ).rejects.toThrow(/timeline already contains an uploaded video/);
    expect(gets).toEqual([]);
  });

  it("reports each step so the UI can explain a long wait", async () => {
    const { api } = makeApi({
      post: (url) =>
        url === "/assets/video/upload" ? uploadResponse("cloud-asset") : {},
      get: ingestedGet
    });
    const steps: string[] = [];

    await ensureCloudAsset(api, {
      localShotId: "local-shot",
      localAssetId: "local-asset",
      cloudTimelineId: "cloud-timeline",
      name: "clip",
      onProgress: (step) => steps.push(step)
    });

    expect(steps).toEqual(["encoding", "uploading", "ingesting"]);
  });
});

describe("ensureCloudImageAsset", () => {
  const imageUploadResponse = (assetId: string) => ({
    asset: { id: assetId },
    s3_url: "https://bucket.s3.amazonaws.com/image?sig=1"
  });

  it("reuses an ingested image without uploading again", async () => {
    await bridge.api.cloud.links.put({
      kind: "asset",
      localId: "local-image",
      cloudId: "cloud-image",
      data: { status: "ingested", kind: "image" }
    });
    const { api, posts } = makeApi();

    await expect(ensureCloudImageAsset(api, "local-image")).resolves.toBe(
      "cloud-image"
    );
    expect(posts).toHaveLength(0);
    expect(bridge.calls).toEqual([]);
  });

  it("uploads again when the cached image was marked stale", async () => {
    await bridge.api.cloud.links.put({
      kind: "asset",
      localId: "local-image",
      cloudId: "deleted-image",
      data: { status: "stale", kind: "image" }
    });
    const { api } = makeApi({
      post: (url) =>
        url === "/assets/image/upload" ? imageUploadResponse("fresh-image") : {}
    });

    await expect(ensureCloudImageAsset(api, "local-image")).resolves.toBe(
      "fresh-image"
    );
    expect(bridge.calls).toEqual(["uploadAsset"]);
    expect(bridge.links.get("asset:local-image")).toMatchObject({
      cloudId: "fresh-image",
      data: { status: "ingested" }
    });
  });

  it("reuses a reference image that came from a cloud project", async () => {
    await bridge.api.cloud.links.put({
      kind: "asset",
      localId: "cloud-image",
      cloudId: "cloud-image",
      data: { origin: "cloud" }
    });
    const { api, posts } = makeApi();

    await expect(ensureCloudImageAsset(api, "cloud-image")).resolves.toBe(
      "cloud-image"
    );
    expect(posts).toHaveLength(0);
  });

  it("registers a webp as the png it is converted to, with its real size", async () => {
    bridge.api.cloud.assetInfo.mockResolvedValueOnce({
      id: "local-image",
      name: "reference.webp",
      extension: "webp",
      width: 800,
      height: 600,
      type: "image",
      sizeBytes: 1024,
      frameCount: null
    });
    const { api, posts } = makeApi({
      post: (url) =>
        url === "/assets/image/upload" ? imageUploadResponse("cloud-image") : {}
    });

    await ensureCloudImageAsset(api, "local-image", "cloud-project");

    expect(posts[0]).toEqual({
      url: "/assets/image/upload",
      body: {
        name: "reference.webp",
        ext: "png",
        size: [800, 600],
        project_id: "cloud-project"
      }
    });
  });

  it("refuses to register an image whose size is unknown", async () => {
    bridge.api.cloud.assetInfo.mockResolvedValueOnce({
      id: "local-image",
      name: "sheet.png",
      extension: "png",
      width: null,
      height: null,
      type: "IMAGE",
      sizeBytes: null,
      frameCount: null
    });
    const { api, posts } = makeApi();

    await expect(ensureCloudImageAsset(api, "local-image")).rejects.toThrow(
      /dimensions could not be read/
    );
    expect(posts).toHaveLength(0);
  });

  it("uploads the thumbnail the web app shows for the image", async () => {
    const { api } = makeApi({
      post: (url) =>
        url === "/assets/image/upload"
          ? {
              ...imageUploadResponse("cloud-image"),
              thumbnail_s3_url: "https://bucket.s3.amazonaws.com/thumb?sig=1"
            }
          : {}
    });

    await ensureCloudImageAsset(api, "local-image");

    expect(bridge.api.cloud.uploadAsset.mock.calls).toEqual([
      [
        {
          assetId: "local-image",
          presignedUrl: "https://bucket.s3.amazonaws.com/image?sig=1"
        }
      ],
      [
        {
          assetId: "local-image",
          presignedUrl: "https://bucket.s3.amazonaws.com/thumb?sig=1"
        }
      ]
    ]);
  });

  it("reports image registration and upload progress", async () => {
    const { api } = makeApi({
      post: (url) =>
        url === "/assets/image/upload" ? imageUploadResponse("cloud-image") : {}
    });
    const steps: string[] = [];

    await ensureCloudImageAsset(api, "local-image", undefined, (step) =>
      steps.push(step)
    );

    expect(steps).toEqual(["asset", "uploading", "done"]);
  });
});

describe("waitForIngestion", () => {
  it("returns as soon as the status is ingested", async () => {
    const { api, gets } = makeApi({
      get: () => ({ asset: { data: { status: "ingested" } } })
    });

    await waitForIngestion(api, "cloud-asset", { attempts: 5, intervalMs: 1 });

    expect(gets).toEqual(["/assets/cloud-asset"]);
  });

  it("keeps polling while the asset is still processing", async () => {
    let seen = 0;
    const { api } = makeApi({
      get: () => {
        seen += 1;
        return {
          asset: { data: { status: seen < 3 ? "processing" : "ingested" } }
        };
      }
    });

    await waitForIngestion(api, "cloud-asset", { attempts: 10, intervalMs: 1 });

    expect(seen).toBe(3);
  });

  it("surfaces the cloud's own error message on failure", async () => {
    const { api } = makeApi({
      get: () => ({
        asset: { data: { status: "error", error: "Unsupported video codec" } }
      })
    });

    await expect(
      waitForIngestion(api, "cloud-asset", { attempts: 5, intervalMs: 1 })
    ).rejects.toThrow(/Unsupported video codec/);
  });

  it("surfaces the reason from the backend's 422 ingestion failure", async () => {
    const { api } = makeApi({
      get: () => {
        throw Object.assign(new Error("Request failed with status code 422"), {
          response: {
            status: 422,
            data: { error: { message: "Video has no decodable frames" } }
          }
        });
      }
    });

    await expect(
      waitForIngestion(api, "cloud-asset", { attempts: 5, intervalMs: 1 })
    ).rejects.toThrow("Video has no decodable frames");
  });

  it("lets other request failures through unchanged", async () => {
    const networkError = new Error("Network Error");
    const { api } = makeApi({
      get: () => {
        throw networkError;
      }
    });

    await expect(
      waitForIngestion(api, "cloud-asset", { attempts: 5, intervalMs: 1 })
    ).rejects.toBe(networkError);
  });

  it("gives up rather than polling forever", async () => {
    const { api } = makeApi({
      get: () => ({ asset: { data: { status: "processing" } } })
    });

    await expect(
      waitForIngestion(api, "cloud-asset", { attempts: 2, intervalMs: 1 })
    ).rejects.toThrow(/did not finish in time/);
  });

  it("treats a missing status as still processing rather than done", async () => {
    // The first probe run read the status from the wrong nesting level and
    // polled a job that had already finished; a bare response must not pass.
    const { api } = makeApi({ get: () => ({ status: "ingested" }) });

    await expect(
      waitForIngestion(api, "cloud-asset", { attempts: 2, intervalMs: 1 })
    ).rejects.toThrow(/did not finish in time/);
  });
});

describe("ensureMirroredShot", () => {
  it("renders a cloud project's shot from its own cloud layer without uploading", async () => {
    await bridge.api.cloud.links.put({
      kind: "project",
      localId: "cloud-project",
      cloudId: "cloud-project",
      data: { origin: "cloud" }
    });
    await bridge.api.cloud.links.put({
      kind: "timeline",
      localId: "cloud-shot",
      cloudId: "cloud-shot",
      data: { origin: "cloud" }
    });
    await bridge.api.cloud.links.put({
      kind: "asset",
      localId: "cloud-source",
      cloudId: "cloud-source",
      data: {
        origin: "cloud",
        status: "ingested",
        cloudLayerId: "cloud-source-layer"
      }
    });
    const { api, posts, gets } = makeApi();

    await expect(
      ensureMirroredShot(api, {
        localProjectId: "cloud-project",
        projectName: "Cloud project",
        localShotId: "cloud-shot",
        shotName: "Shot",
        localAssetId: "cloud-source",
        assetName: "source"
      })
    ).resolves.toEqual({
      cloudProjectId: "cloud-project",
      cloudTimelineId: "cloud-shot",
      cloudAssetId: "cloud-source",
      cloudLayerId: "cloud-source-layer",
      cloudSourceVideoLinkLocalId: "cloud-source"
    });
    expect(posts).toHaveLength(0);
    expect(gets).toEqual([]);
    expect(bridge.calls).toEqual([]);
  });

  it("walks the whole chain once and is cheap the second time", async () => {
    const { api, posts } = makeApi({
      post: (url) => {
        if (url === "/projects") return { id: "cloud-project" };
        if (url.startsWith("/timelines/")) return { id: "cloud-timeline" };
        if (url === "/assets/video/upload")
          return uploadResponse("cloud-asset");
        return {};
      },
      get: () => ({ asset: { data: { status: "ingested" } } })
    });
    const input = {
      localProjectId: "local-project",
      projectName: "Project",
      localShotId: "local-shot",
      shotName: "Shot",
      localAssetId: "local-asset",
      assetName: "clip"
    };

    const first = await ensureMirroredShot(api, input);
    expect(first).toEqual({
      cloudProjectId: "cloud-project",
      cloudTimelineId: "cloud-timeline",
      cloudAssetId: "cloud-asset",
      // The layer holding the input video, which a render needs as its source.
      cloudLayerId: "cloud-layer",
      cloudSourceVideoLinkLocalId: "local-asset#shot-local-shot#trim-full"
    });
    const afterFirst = posts.length;

    const second = await ensureMirroredShot(api, input);
    expect(second).toEqual(first);
    // Everything short-circuits on its cached link.
    expect(posts).toHaveLength(afterFirst);
  });

  it("remaps an occupied timeline and retries video registration once", async () => {
    await bridge.api.cloud.links.put({
      kind: "project",
      localId: "local-project",
      cloudId: "cloud-project"
    });
    await bridge.api.cloud.links.put({
      kind: "timeline",
      localId: "local-shot",
      cloudId: "occupied-timeline"
    });

    let uploadAttempts = 0;
    const { api, posts } = makeApi({
      post: (url) => {
        if (url === "/timelines/cloud-project") return { id: "fresh-timeline" };
        if (url === "/assets/video/upload") {
          uploadAttempts += 1;
          if (uploadAttempts === 1) {
            return {
              timeline: {
                id: "occupied-timeline",
                layers: [
                  {
                    id: "old-layer",
                    clips: [{ asset: { id: "old-asset" } }]
                  }
                ]
              }
            };
          }
          return {
            ...uploadResponse("cloud-asset"),
            timeline: {
              id: "fresh-timeline",
              layers: [
                {
                  id: "cloud-layer",
                  clips: [{ asset: { id: "cloud-asset" } }]
                }
              ]
            }
          };
        }
        return {};
      },
      get: () => ({ asset: { data: { status: "ingested" } } })
    });

    await expect(
      ensureMirroredShot(api, {
        localProjectId: "local-project",
        projectName: "Project",
        localShotId: "local-shot",
        shotName: "Shot",
        localAssetId: "local-asset",
        assetName: "clip"
      })
    ).resolves.toEqual({
      cloudProjectId: "cloud-project",
      cloudTimelineId: "fresh-timeline",
      cloudAssetId: "cloud-asset",
      cloudLayerId: "cloud-layer",
      cloudSourceVideoLinkLocalId: "local-asset#shot-local-shot#trim-full"
    });

    expect(
      posts.filter((entry) => entry.url === "/assets/video/upload")
    ).toHaveLength(2);
    expect(bridge.links.get("timeline:local-shot")?.cloudId).toBe(
      "fresh-timeline"
    );
  });
});

describe("trimmed source videos", () => {
  const makeOneSourcePerTimelineCloud = () => {
    const occupyingLayerByCloudTimelineId = new Map<
      string,
      { id: string; clips: { asset: { id: string } }[] }
    >();
    let createdTimelineCount = 0;
    let uploadedAssetCount = 0;
    return makeApi({
      post: (url, body) => {
        if (url === "/projects") return { id: "cloud-project" };
        if (url.startsWith("/timelines/")) {
          createdTimelineCount += 1;
          return { id: `cloud-timeline-${createdTimelineCount}` };
        }
        if (url !== "/assets/video/upload") return {};
        const { timeline_id: cloudTimelineId } = body as {
          timeline_id: string;
        };
        const occupyingLayer =
          occupyingLayerByCloudTimelineId.get(cloudTimelineId);
        if (occupyingLayer) {
          return {
            timeline: { id: cloudTimelineId, layers: [occupyingLayer] }
          };
        }
        uploadedAssetCount += 1;
        const cloudAssetId = `cloud-asset-${uploadedAssetCount}`;
        const uploadedLayer = {
          id: `cloud-layer-${uploadedAssetCount}`,
          clips: [{ asset: { id: cloudAssetId } }]
        };
        occupyingLayerByCloudTimelineId.set(cloudTimelineId, uploadedLayer);
        return {
          video_url: `https://bucket.s3.amazonaws.com/${cloudAssetId}`,
          timeline: { id: cloudTimelineId, layers: [uploadedLayer] }
        };
      },
      get: () => ({ asset: { data: { status: "ingested" } } })
    });
  };

  const makeCountingUploadCloud = () => {
    let uploadedAssetCount = 0;
    return makeApi({
      post: (url) => {
        if (url !== "/assets/video/upload") return {};
        uploadedAssetCount += 1;
        return uploadResponse(`cloud-asset-${uploadedAssetCount}`);
      },
      get: () => ({ asset: { data: { status: "ingested" } } })
    });
  };

  const videoUploadCount = (posts: { url: string }[]) =>
    posts.filter((entry) => entry.url === "/assets/video/upload").length;

  it("uploads a second trim of the same asset as its own cloud asset", async () => {
    const { api } = makeCountingUploadCloud();

    const firstTrimCloudAssetId = await ensureCloudAsset(api, {
      localShotId: "local-shot",
      localAssetId: "shared-asset",
      cloudTimelineId: "cloud-timeline-a",
      name: "clip",
      trimStartSeconds: 1,
      trimEndSeconds: 3
    });
    const secondTrimCloudAssetId = await ensureCloudAsset(api, {
      localShotId: "local-shot",
      localAssetId: "shared-asset",
      cloudTimelineId: "cloud-timeline-b",
      name: "clip",
      trimStartSeconds: 5,
      trimEndSeconds: 9
    });

    expect(secondTrimCloudAssetId).not.toBe(firstTrimCloudAssetId);
    expect(bridge.api.cloud.prepareUpload).toHaveBeenLastCalledWith({
      assetId: "shared-asset",
      trimStartSeconds: 5,
      trimEndSeconds: 9
    });
    expect(bridge.api.cloud.uploadPrepared).toHaveBeenLastCalledWith({
      assetId: "shared-asset",
      trimStartSeconds: 5,
      trimEndSeconds: 9,
      presignedUrl: "https://bucket.s3.amazonaws.com/key?sig=1"
    });
  });

  it("never re-uploads a trim that is already in the cloud, whichever trim ran last", async () => {
    const { api, posts } = makeCountingUploadCloud();
    const firstTrim = { trimStartSeconds: 1, trimEndSeconds: 3 };
    const secondTrim = { trimStartSeconds: 5, trimEndSeconds: 9 };
    const mirrorTrim = (trim: typeof firstTrim) =>
      ensureCloudAsset(api, {
        localShotId: "local-shot",
        localAssetId: "shared-asset",
        cloudTimelineId: "cloud-timeline",
        name: "clip",
        ...trim
      });

    const firstTrimCloudAssetId = await mirrorTrim(firstTrim);
    const secondTrimCloudAssetId = await mirrorTrim(secondTrim);
    const uploadsAfterBothTrims = videoUploadCount(posts);

    await expect(mirrorTrim(firstTrim)).resolves.toBe(firstTrimCloudAssetId);
    await expect(mirrorTrim(secondTrim)).resolves.toBe(secondTrimCloudAssetId);
    expect(videoUploadCount(posts)).toBe(uploadsAfterBothTrims);
  });

  it("does not reuse an untrimmed upload for a trimmed shot", async () => {
    await bridge.api.cloud.links.put({
      kind: "asset",
      localId: "shared-asset",
      cloudId: "untrimmed-cloud-asset",
      data: { status: "ingested", cloudLayerId: "untrimmed-layer" }
    });
    const { api } = makeApi({
      post: (url) =>
        url === "/assets/video/upload" ? uploadResponse("trimmed-asset") : {},
      get: () => ({ asset: { data: { status: "ingested" } } })
    });

    await expect(
      ensureCloudAsset(api, {
        localShotId: "local-shot",
        localAssetId: "shared-asset",
        cloudTimelineId: "cloud-timeline",
        name: "clip",
        trimStartSeconds: 2
      })
    ).resolves.toBe("trimmed-asset");
    expect(bridge.links.get("asset:shared-asset")?.cloudId).toBe(
      "untrimmed-cloud-asset"
    );
  });

  it("never re-encodes a cloud-origin source, whatever trim is asked for", async () => {
    await bridge.api.cloud.links.put({
      kind: "asset",
      localId: "cloud-source",
      cloudId: "cloud-source",
      data: { origin: "cloud", cloudLayerId: "cloud-source-layer" }
    });
    const { api, posts } = makeApi();

    await expect(
      ensureCloudAsset(api, {
        localShotId: "local-shot",
        localAssetId: "cloud-source",
        cloudTimelineId: "cloud-timeline",
        name: "clip",
        trimStartSeconds: 2,
        trimEndSeconds: 4
      })
    ).resolves.toBe("cloud-source");
    expect(posts).toHaveLength(0);
    expect(bridge.calls).toEqual([]);
  });

  it("gives two shots that trim one asset differently their own cloud asset and layer", async () => {
    const { api, posts } = makeOneSourcePerTimelineCloud();
    const shotInput = {
      localProjectId: "local-project",
      projectName: "Project",
      shotName: "Shot",
      localAssetId: "shared-asset",
      assetName: "clip"
    };

    const firstShot = await ensureMirroredShot(api, {
      ...shotInput,
      localShotId: "first-shot",
      trimStartSeconds: 1,
      trimEndSeconds: 3
    });
    const secondShot = await ensureMirroredShot(api, {
      ...shotInput,
      localShotId: "second-shot",
      trimStartSeconds: 5,
      trimEndSeconds: 9
    });

    expect(secondShot.cloudAssetId).not.toBe(firstShot.cloudAssetId);
    expect(secondShot.cloudLayerId).not.toBe(firstShot.cloudLayerId);
    expect(videoUploadCount(posts)).toBe(2);
  });

  it("moves a shot whose trim changed onto a fresh cloud timeline", async () => {
    const { api, posts } = makeOneSourcePerTimelineCloud();
    const shotInput = {
      localProjectId: "local-project",
      projectName: "Project",
      localShotId: "local-shot",
      shotName: "Shot",
      localAssetId: "local-asset",
      assetName: "clip"
    };

    const beforeTrimChange = await ensureMirroredShot(api, {
      ...shotInput,
      trimStartSeconds: 1,
      trimEndSeconds: 3
    });
    const afterTrimChange = await ensureMirroredShot(api, {
      ...shotInput,
      trimStartSeconds: 2,
      trimEndSeconds: 6
    });

    expect(afterTrimChange.cloudTimelineId).not.toBe(
      beforeTrimChange.cloudTimelineId
    );
    expect(afterTrimChange.cloudAssetId).not.toBe(
      beforeTrimChange.cloudAssetId
    );
    expect(afterTrimChange.cloudLayerId).not.toBe(
      beforeTrimChange.cloudLayerId
    );
    expect(bridge.links.get("timeline:local-shot")?.cloudId).toBe(
      afterTrimChange.cloudTimelineId
    );
    expect(bridge.api.cloud.uploadPrepared).toHaveBeenLastCalledWith(
      expect.objectContaining({ trimStartSeconds: 2, trimEndSeconds: 6 })
    );

    const uploadsAfterTrimChange = videoUploadCount(posts);
    await expect(
      ensureMirroredShot(api, {
        ...shotInput,
        trimStartSeconds: 2,
        trimEndSeconds: 6
      })
    ).resolves.toEqual(afterTrimChange);
    expect(videoUploadCount(posts)).toBe(uploadsAfterTrimChange);
  });
});

describe("one asset in several shots", () => {
  const makeOneSourcePerTimelineCloud = (
    cloudTimelineById: Record<string, unknown> = {}
  ) => {
    const occupyingLayerByCloudTimelineId = new Map<
      string,
      { id: string; clips: { asset: { id: string } }[] }
    >();
    let createdTimelineCount = 0;
    let uploadedAssetCount = 0;
    return makeApi({
      post: (url, body) => {
        if (url === "/projects") return { id: "cloud-project" };
        if (url.startsWith("/timelines/")) {
          createdTimelineCount += 1;
          return { id: `cloud-timeline-${createdTimelineCount}` };
        }
        if (url !== "/assets/video/upload") return {};
        const { timeline_id: cloudTimelineId } = body as {
          timeline_id: string;
        };
        const occupyingLayer =
          occupyingLayerByCloudTimelineId.get(cloudTimelineId);
        if (occupyingLayer) {
          return {
            timeline: { id: cloudTimelineId, layers: [occupyingLayer] }
          };
        }
        uploadedAssetCount += 1;
        const cloudAssetId = `cloud-asset-${uploadedAssetCount}`;
        const uploadedLayer = {
          id: `cloud-layer-${uploadedAssetCount}`,
          clips: [{ asset: { id: cloudAssetId } }]
        };
        occupyingLayerByCloudTimelineId.set(cloudTimelineId, uploadedLayer);
        return {
          video_url: `https://bucket.s3.amazonaws.com/${cloudAssetId}`,
          timeline: { id: cloudTimelineId, layers: [uploadedLayer] }
        };
      },
      get: (url) => {
        const timelinePrefix = "/timeline/";
        if (url.startsWith(timelinePrefix))
          return {
            project_id: "cloud-project",
            ...(cloudTimelineById[url.slice(timelinePrefix.length)] ?? {})
          };
        return { asset: { data: { status: "ingested" } } };
      }
    });
  };

  const shotInput = {
    localProjectId: "local-project",
    projectName: "Project",
    shotName: "Shot",
    localAssetId: "shared-asset",
    assetName: "clip"
  };

  const registeredCloudTimelineIds = (
    posts: { url: string; body?: unknown }[]
  ) =>
    posts
      .filter((entry) => entry.url === "/assets/video/upload")
      .map((entry) => (entry.body as { timeline_id: string }).timeline_id);

  it.each([
    ["untrimmed", {}],
    ["trimmed", { trimStartSeconds: 1, trimEndSeconds: 3 }]
  ])(
    "gives each shot that uses one %s asset its own cloud source on its own timeline",
    async (_label, trim) => {
      const { api, posts } = makeOneSourcePerTimelineCloud();

      const firstShot = await ensureMirroredShot(api, {
        ...shotInput,
        ...trim,
        localShotId: "first-shot"
      });
      const secondShot = await ensureMirroredShot(api, {
        ...shotInput,
        ...trim,
        localShotId: "second-shot"
      });

      expect(secondShot.cloudTimelineId).not.toBe(firstShot.cloudTimelineId);
      expect(secondShot.cloudAssetId).not.toBe(firstShot.cloudAssetId);
      expect(secondShot.cloudLayerId).not.toBe(firstShot.cloudLayerId);
      expect(registeredCloudTimelineIds(posts)).toEqual([
        firstShot.cloudTimelineId,
        secondShot.cloudTimelineId
      ]);
      expect(bridge.api.cloud.prepareUpload).toHaveBeenCalledTimes(2);
      expect(bridge.api.cloud.prepareUpload).toHaveBeenLastCalledWith({
        assetId: "shared-asset",
        ...trim
      });
    }
  );

  it("never re-uploads a shot's own source, whichever shot ran last", async () => {
    const { api, posts } = makeOneSourcePerTimelineCloud();
    const mirrorShot = (localShotId: string) =>
      ensureMirroredShot(api, { ...shotInput, localShotId });

    const firstShot = await mirrorShot("first-shot");
    const secondShot = await mirrorShot("second-shot");
    const uploadsAfterBothShots = registeredCloudTimelineIds(posts).length;

    await expect(mirrorShot("first-shot")).resolves.toEqual(firstShot);
    await expect(mirrorShot("second-shot")).resolves.toEqual(secondShot);
    expect(registeredCloudTimelineIds(posts)).toHaveLength(
      uploadsAfterBothShots
    );
  });

  const seedLinksFromBeforeSourcesWereShotScoped = async () => {
    await bridge.api.cloud.links.put({
      kind: "project",
      localId: "local-project",
      cloudId: "cloud-project"
    });
    await bridge.api.cloud.links.put({
      kind: "timeline",
      localId: "owning-shot",
      cloudId: "owning-timeline"
    });
    await bridge.api.cloud.links.put({
      kind: "timeline",
      localId: "borrowing-shot",
      cloudId: "borrowing-timeline"
    });
    await bridge.api.cloud.links.put({
      kind: "asset",
      localId: "shared-asset",
      cloudId: "asset-scoped-cloud-asset",
      data: { status: "ingested", cloudLayerId: "asset-scoped-layer" }
    });
  };

  const cloudTimelinesFromBeforeSourcesWereShotScoped = {
    "owning-timeline": {
      id: "owning-timeline",
      layers: [
        {
          id: "asset-scoped-layer",
          clips: [{ asset: { id: "asset-scoped-cloud-asset" } }]
        }
      ]
    },
    "borrowing-timeline": { id: "borrowing-timeline", layers: [] }
  };

  it("adopts an asset-scoped link for the shot whose cloud timeline holds it", async () => {
    await seedLinksFromBeforeSourcesWereShotScoped();
    const { api, posts, gets } = makeOneSourcePerTimelineCloud(
      cloudTimelinesFromBeforeSourcesWereShotScoped
    );

    await expect(
      ensureMirroredShot(api, { ...shotInput, localShotId: "owning-shot" })
    ).resolves.toEqual({
      cloudProjectId: "cloud-project",
      cloudTimelineId: "owning-timeline",
      cloudAssetId: "asset-scoped-cloud-asset",
      cloudLayerId: "asset-scoped-layer",
      cloudSourceVideoLinkLocalId: "shared-asset#shot-owning-shot#trim-full"
    });
    expect(registeredCloudTimelineIds(posts)).toEqual([]);
    expect(bridge.calls).toEqual([]);

    const timelineReadsAfterAdoption = gets.length;
    await ensureMirroredShot(api, { ...shotInput, localShotId: "owning-shot" });
    expect(gets).toHaveLength(timelineReadsAfterAdoption);
  });

  it("uploads its own source for a shot whose cloud timeline does not hold the asset-scoped link", async () => {
    await seedLinksFromBeforeSourcesWereShotScoped();
    const { api, posts } = makeOneSourcePerTimelineCloud(
      cloudTimelinesFromBeforeSourcesWereShotScoped
    );

    const borrowingShot = await ensureMirroredShot(api, {
      ...shotInput,
      localShotId: "borrowing-shot"
    });

    expect(borrowingShot.cloudTimelineId).toBe("borrowing-timeline");
    expect(borrowingShot.cloudAssetId).not.toBe("asset-scoped-cloud-asset");
    expect(borrowingShot.cloudLayerId).not.toBe("asset-scoped-layer");
    expect(registeredCloudTimelineIds(posts)).toEqual(["borrowing-timeline"]);
    expect(bridge.links.get("asset:shared-asset")?.cloudId).toBe(
      "asset-scoped-cloud-asset"
    );
  });

  it("re-uploads rather than re-adopting an asset-scoped link once the shot's own link went stale", async () => {
    await seedLinksFromBeforeSourcesWereShotScoped();
    const { api, posts } = makeOneSourcePerTimelineCloud(
      cloudTimelinesFromBeforeSourcesWereShotScoped
    );
    const adopted = await ensureMirroredShot(api, {
      ...shotInput,
      localShotId: "owning-shot"
    });
    await bridge.api.cloud.links.patch({
      kind: "asset",
      localId: adopted.cloudSourceVideoLinkLocalId,
      patch: { status: "stale" }
    });

    const remirrored = await ensureMirroredShot(api, {
      ...shotInput,
      localShotId: "owning-shot"
    });

    expect(remirrored.cloudAssetId).not.toBe("asset-scoped-cloud-asset");
    expect(registeredCloudTimelineIds(posts)).toEqual(["owning-timeline"]);
  });

  it("never reuses a shot's source from a cloud timeline the shot has moved off", async () => {
    await bridge.api.cloud.links.put({
      kind: "asset",
      localId: "shared-asset#shot-local-shot#trim-full",
      cloudId: "source-on-old-timeline",
      data: {
        status: "ingested",
        sourceVideoTrimKey: "full",
        cloudTimelineId: "old-timeline",
        cloudLayerId: "old-layer"
      }
    });
    const { api, posts } = makeOneSourcePerTimelineCloud();

    await expect(
      ensureCloudAsset(api, {
        localAssetId: "shared-asset",
        localShotId: "local-shot",
        cloudTimelineId: "new-timeline",
        name: "clip"
      })
    ).resolves.not.toBe("source-on-old-timeline");
    expect(registeredCloudTimelineIds(posts)).toEqual(["new-timeline"]);
  });

  it("keeps rendering a cloud-origin source from its own cloud asset in every shot", async () => {
    await bridge.api.cloud.links.put({
      kind: "asset",
      localId: "cloud-source",
      cloudId: "cloud-source",
      data: { origin: "cloud", cloudLayerId: "cloud-source-layer" }
    });
    const { api, posts } = makeOneSourcePerTimelineCloud();

    const shots = await Promise.all(
      ["first-shot", "second-shot"].map((localShotId) =>
        ensureMirroredShot(api, {
          ...shotInput,
          localAssetId: "cloud-source",
          localShotId
        })
      )
    );

    expect(shots.map((shot) => shot.cloudAssetId)).toEqual([
      "cloud-source",
      "cloud-source"
    ]);
    expect(registeredCloudTimelineIds(posts)).toEqual([]);
  });
});
