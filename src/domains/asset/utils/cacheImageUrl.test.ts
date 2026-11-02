import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./cacheStorage", () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn()
}));

import { cacheImageUrl } from "./cacheImageUrl";
import { cacheGet, cacheSet } from "./cacheStorage";

const cacheGetMock = cacheGet as unknown as ReturnType<typeof vi.fn>;
const cacheSetMock = cacheSet as unknown as ReturnType<typeof vi.fn>;

const IMAGE_URL = "https://cdn.example.com/sheet.png";
const CACHE_KEY = "asset-1";
const OBJECT_URL = "blob:sheet";
const UrlConstructor = URL;

const respondWith = (blob: Blob, ok = true) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok, blob: () => Promise.resolve(blob) }))
  );

describe("cacheImageUrl", () => {
  beforeEach(() => {
    cacheGetMock.mockReset();
    cacheSetMock.mockReset();
    cacheSetMock.mockResolvedValue(undefined);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => OBJECT_URL),
      revokeObjectURL: vi.fn()
    });
  });

  it("skips the cache entirely for a URL it cannot fetch", async () => {
    const result = await cacheImageUrl("data:image/png;base64,abc", CACHE_KEY);

    expect(result).toEqual({
      urlToUse: "data:image/png;base64,abc",
      isCached: false
    });
    expect(cacheGetMock).not.toHaveBeenCalled();
  });

  it("serves a cached image without fetching it again", async () => {
    cacheGetMock.mockResolvedValueOnce(new Blob(["bytes"]));
    respondWith(new Blob(["bytes"]));

    const result = await cacheImageUrl(IMAGE_URL, CACHE_KEY);

    expect(result).toEqual({ urlToUse: OBJECT_URL, isCached: true });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("leaves a render that answered with no bytes uncached, on the direct URL", async () => {
    cacheGetMock.mockResolvedValueOnce(undefined);
    respondWith(new Blob([]));

    const result = await cacheImageUrl(IMAGE_URL, CACHE_KEY);

    expect(result).toEqual({ urlToUse: IMAGE_URL, isCached: false });
    expect(cacheSetMock).not.toHaveBeenCalled();
  });

  it("re-fetches instead of serving an empty entry an earlier run stored", async () => {
    cacheGetMock.mockResolvedValueOnce(new Blob([]));
    const fetched = new Blob(["bytes"]);
    respondWith(fetched);

    const result = await cacheImageUrl(IMAGE_URL, CACHE_KEY);

    expect(result).toEqual({ urlToUse: OBJECT_URL, isCached: true });
    expect(cacheSetMock).toHaveBeenCalledWith("image", CACHE_KEY, fetched);
  });

  it("reads a presigned S3 image through the desktop media protocol", async () => {
    const presignedUrl =
      "https://mago-s3-prod.s3.eu-north-1.amazonaws.com/a/sheet.png?X-Amz-Signature=abc";
    const desktopUrl = `mago-media://cloud-storage/?url=${encodeURIComponent(presignedUrl)}`;
    vi.stubGlobal("URL", UrlConstructor);
    cacheGetMock.mockResolvedValueOnce(undefined);
    respondWith(new Blob(["bytes"]), false);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await cacheImageUrl(presignedUrl, CACHE_KEY);

    expect(fetch).toHaveBeenCalledWith(desktopUrl, {
      signal: expect.any(AbortSignal)
    });
    expect(result).toEqual({ urlToUse: desktopUrl, isCached: false });
    warn.mockRestore();
  });

  it("falls back to the direct URL when the fetch is not ok", async () => {
    cacheGetMock.mockResolvedValueOnce(undefined);
    respondWith(new Blob(["bytes"]), false);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await cacheImageUrl(IMAGE_URL, CACHE_KEY);

    expect(result).toEqual({ urlToUse: IMAGE_URL, isCached: false });
    expect(cacheSetMock).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
