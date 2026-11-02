import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./cacheStorage", () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn()
}));
vi.mock("./downloadVideoInChunks", () => ({
  downloadVideoInChunks: vi.fn()
}));

import { cacheGet, cacheSet } from "./cacheStorage";
import { cacheVideoUrl } from "./cacheVideoUrl";
import { downloadVideoInChunks } from "./downloadVideoInChunks";

const cacheGetMock = cacheGet as unknown as ReturnType<typeof vi.fn>;
const cacheSetMock = cacheSet as unknown as ReturnType<typeof vi.fn>;
const downloadMock = downloadVideoInChunks as unknown as ReturnType<
  typeof vi.fn
>;

const VIDEO_URL = "https://cdn.example.com/shot.mp4";
const CACHE_KEY = "asset-1";
const OBJECT_URL = "blob:shot";

describe("cacheVideoUrl", () => {
  beforeEach(() => {
    cacheGetMock.mockReset();
    cacheSetMock.mockReset();
    downloadMock.mockReset();
    cacheSetMock.mockResolvedValue(undefined);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => OBJECT_URL),
      revokeObjectURL: vi.fn()
    });
  });

  it("serves a cached video without downloading it again", async () => {
    cacheGetMock.mockResolvedValueOnce(new Blob(["bytes"]));

    const result = await cacheVideoUrl(VIDEO_URL, CACHE_KEY);

    expect(result).toEqual({ urlToUse: OBJECT_URL, isCached: true });
    expect(downloadMock).not.toHaveBeenCalled();
  });

  it("downloads on a miss and writes the result through to the cache", async () => {
    cacheGetMock.mockResolvedValueOnce(undefined);
    const fetched = new Blob(["bytes"]);
    downloadMock.mockResolvedValueOnce(fetched);

    const result = await cacheVideoUrl(VIDEO_URL, CACHE_KEY);

    expect(result).toEqual({ urlToUse: OBJECT_URL, isCached: true });
    expect(cacheSetMock).toHaveBeenCalledWith("video", CACHE_KEY, fetched);
  });

  it("leaves a render that answered with no bytes uncached, on the direct URL", async () => {
    cacheGetMock.mockResolvedValueOnce(undefined);
    downloadMock.mockResolvedValueOnce(new Blob([]));

    const result = await cacheVideoUrl(VIDEO_URL, CACHE_KEY);

    expect(result).toEqual({ urlToUse: VIDEO_URL, isCached: false });
    expect(cacheSetMock).not.toHaveBeenCalled();
  });

  it("re-downloads instead of serving an empty entry an earlier run stored", async () => {
    cacheGetMock.mockResolvedValueOnce(new Blob([]));
    const fetched = new Blob(["bytes"]);
    downloadMock.mockResolvedValueOnce(fetched);

    const result = await cacheVideoUrl(VIDEO_URL, CACHE_KEY);

    expect(result).toEqual({ urlToUse: OBJECT_URL, isCached: true });
    expect(cacheSetMock).toHaveBeenCalledWith("video", CACHE_KEY, fetched);
  });

  it("falls back to the direct URL when the download fails", async () => {
    cacheGetMock.mockResolvedValueOnce(undefined);
    downloadMock.mockRejectedValueOnce(new Error("Failed to fetch video: 404"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await cacheVideoUrl(VIDEO_URL, CACHE_KEY);

    expect(result).toEqual({ urlToUse: VIDEO_URL, isCached: false });
    expect(cacheSetMock).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
