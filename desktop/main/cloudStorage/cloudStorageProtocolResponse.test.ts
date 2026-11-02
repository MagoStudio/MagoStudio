import { describe, expect, it, vi } from "vitest";

import { cloudStorageProtocolResponse } from "./cloudStorageProtocolResponse";

const ALLOWED_HOSTS = ["mago-s3-prod.s3.amazonaws.com"];
const OBJECT_URL = "https://mago-s3-prod.s3.amazonaws.com/a/video.mp4?sig=1";

const protocolRequest = (objectUrl: string, init: RequestInit = {}): Request =>
  new Request(
    `mago-media://cloud-storage/?url=${encodeURIComponent(objectUrl)}`,
    init
  );

describe("cloudStorageProtocolResponse", () => {
  it("streams an allowed object with its range headers and a CORS header", async () => {
    const fetchFromCloudStorage = vi.fn().mockResolvedValue(
      new Response("part", {
        status: 206,
        headers: {
          "content-type": "video/mp4",
          "content-length": "4",
          "content-range": "bytes 0-3/100",
          "accept-ranges": "bytes",
          "x-amz-request-id": "internal"
        }
      })
    );

    const response = await cloudStorageProtocolResponse(
      protocolRequest(OBJECT_URL, { headers: { range: "bytes=0-3" } }),
      ALLOWED_HOSTS,
      fetchFromCloudStorage
    );

    expect(response.status).toBe(206);
    expect(await response.text()).toBe("part");
    expect(response.headers.get("content-range")).toBe("bytes 0-3/100");
    expect(response.headers.get("content-type")).toBe("video/mp4");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("x-amz-request-id")).toBeNull();
    expect(fetchFromCloudStorage.mock.calls[0]![1]).toMatchObject({
      headers: { range: "bytes=0-3" }
    });
  });

  it("forbids a URL outside the allowlist without fetching it", async () => {
    const fetchFromCloudStorage = vi.fn();

    const response = await cloudStorageProtocolResponse(
      protocolRequest("https://evil.example/a.png"),
      ALLOWED_HOSTS,
      fetchFromCloudStorage
    );

    expect(response.status).toBe(403);
    expect(fetchFromCloudStorage).not.toHaveBeenCalled();
  });

  it("forbids a request with no object URL", async () => {
    const response = await cloudStorageProtocolResponse(
      new Request("mago-media://cloud-storage/"),
      ALLOWED_HOSTS,
      vi.fn()
    );

    expect(response.status).toBe(403);
  });

  it("refuses anything but a read", async () => {
    const fetchFromCloudStorage = vi.fn();

    const response = await cloudStorageProtocolResponse(
      protocolRequest(OBJECT_URL, { method: "PUT", body: "x" }),
      ALLOWED_HOSTS,
      fetchFromCloudStorage
    );

    expect(response.status).toBe(405);
    expect(fetchFromCloudStorage).not.toHaveBeenCalled();
  });

  it("answers a HEAD without a body", async () => {
    const fetchFromCloudStorage = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { "content-length": "100" }
      })
    );

    const response = await cloudStorageProtocolResponse(
      protocolRequest(OBJECT_URL, { method: "HEAD" }),
      ALLOWED_HOSTS,
      fetchFromCloudStorage
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-length")).toBe("100");
    expect(fetchFromCloudStorage.mock.calls[0]![1]).toMatchObject({
      method: "HEAD"
    });
  });

  it("reports an unreachable bucket as a bad gateway", async () => {
    const response = await cloudStorageProtocolResponse(
      protocolRequest(OBJECT_URL),
      ALLOWED_HOSTS,
      vi.fn().mockRejectedValue(new Error("ENOTFOUND"))
    );

    expect(response.status).toBe(502);
  });
});
