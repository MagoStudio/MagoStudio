import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get }
}));

import { downloadLayerVideo, getLayerDownloadSignedUrl } from "./downloadFiles";

const SIGNED_URL =
  "https://mago-s3-prod.s3.eu-north-1.amazonaws.com/a/video.mp4?X-Amz-Signature=abc";

const notFoundError = () =>
  new AxiosError("Not found", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 404,
    statusText: "Not Found",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: null
  });

describe("layer downloads", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("reads the presigned S3 file through the desktop media protocol", async () => {
    get.mockResolvedValue({ data: { url: SIGNED_URL } });
    const fetchThroughProtocol = vi
      .fn()
      .mockResolvedValue(new Response("video", { status: 200 }));
    vi.stubGlobal("fetch", fetchThroughProtocol);

    const video = await downloadLayerVideo({ layerId: "layer-1" });

    expect(get).toHaveBeenCalledWith("/download/video/layer/layer-1");
    expect(fetchThroughProtocol).toHaveBeenCalledWith(
      `mago-media://cloud-storage/?url=${encodeURIComponent(SIGNED_URL)}`
    );
    expect(video.size).toBe("video".length);
  });

  it("reports a file the bucket no longer holds as not found", async () => {
    get.mockResolvedValue({ data: { url: SIGNED_URL } });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 404 }))
    );

    await expect(downloadLayerVideo({ layerId: "layer-1" })).rejects.toThrow(
      "File not found"
    );
  });

  it("reports a layer the backend cannot find as not found", async () => {
    get.mockRejectedValue(notFoundError());

    await expect(
      getLayerDownloadSignedUrl({ layerId: "layer-1", kind: "frames" })
    ).rejects.toThrow("File not found");
  });
});
