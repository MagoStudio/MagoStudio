import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./cacheStorage", () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn()
}));
vi.mock("./downloadVideoInChunks", () => ({
  downloadVideoInChunks: vi.fn()
}));

import { cacheGet, cacheSet } from "./cacheStorage";
import { downloadVideoInChunks } from "./downloadVideoInChunks";
import { getCachedVideoBlob } from "./getCachedVideoBlob";

const cacheGetMock = cacheGet as unknown as ReturnType<typeof vi.fn>;
const cacheSetMock = cacheSet as unknown as ReturnType<typeof vi.fn>;
const downloadMock = downloadVideoInChunks as unknown as ReturnType<
  typeof vi.fn
>;

const URL_VALUE = "https://cdn.example.com/clip.mp4";

describe("getCachedVideoBlob", () => {
  beforeEach(() => {
    cacheGetMock.mockReset();
    cacheSetMock.mockReset();
    downloadMock.mockReset();
    cacheSetMock.mockResolvedValue(undefined);
  });

  it("returns the cached Blob on hit without falling back to download", async () => {
    const cached = new Blob(["cached"], { type: "video/mp4" });
    cacheGetMock.mockResolvedValueOnce(cached);

    const result = await getCachedVideoBlob(URL_VALUE);

    expect(result).toBe(cached);
    expect(downloadMock).not.toHaveBeenCalled();
    expect(cacheSetMock).not.toHaveBeenCalled();
  });

  it("falls back to chunked download on miss and writes the result through to the cache", async () => {
    cacheGetMock.mockResolvedValueOnce(undefined);
    const fetched = new Blob(["fetched"], { type: "video/mp4" });
    downloadMock.mockResolvedValueOnce(fetched);

    const result = await getCachedVideoBlob(URL_VALUE);

    expect(result).toBe(fetched);
    expect(downloadMock).toHaveBeenCalledWith(
      URL_VALUE,
      undefined,
      URL_VALUE,
      expect.any(AbortSignal)
    );
    expect(cacheSetMock).toHaveBeenCalledWith("video", URL_VALUE, fetched);
  });

  it("uses the explicit cache key when provided", async () => {
    cacheGetMock.mockResolvedValueOnce(undefined);
    downloadMock.mockResolvedValueOnce(new Blob(["x"]));

    await getCachedVideoBlob(URL_VALUE, "custom-key");

    expect(cacheGetMock).toHaveBeenCalledWith("video", "custom-key");
    expect(cacheSetMock).toHaveBeenCalledWith(
      "video",
      "custom-key",
      expect.any(Blob)
    );
  });

  it("refuses to cache a render that answered with no bytes yet", async () => {
    cacheGetMock.mockResolvedValueOnce(undefined);
    downloadMock.mockResolvedValueOnce(new Blob([], { type: "video/mp4" }));

    await expect(getCachedVideoBlob(URL_VALUE)).rejects.toThrow(
      "Video has no bytes yet"
    );
    expect(cacheSetMock).not.toHaveBeenCalled();
  });

  it("re-downloads instead of serving an empty entry an earlier run stored", async () => {
    cacheGetMock.mockResolvedValueOnce(new Blob([], { type: "video/mp4" }));
    const fetched = new Blob(["fetched"], { type: "video/mp4" });
    downloadMock.mockResolvedValueOnce(fetched);

    const result = await getCachedVideoBlob(URL_VALUE);

    expect(result).toBe(fetched);
    expect(cacheSetMock).toHaveBeenCalledWith("video", URL_VALUE, fetched);
  });

  it("still returns the downloaded Blob when the cache write-through fails", async () => {
    cacheGetMock.mockResolvedValueOnce(undefined);
    const fetched = new Blob(["fetched"]);
    downloadMock.mockResolvedValueOnce(fetched);
    cacheSetMock.mockRejectedValueOnce(new Error("OPFS quota exceeded"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await getCachedVideoBlob(URL_VALUE);

    expect(result).toBe(fetched);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
