import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@app/services/mediaBunny", () => ({
  extractFrameFromVideo: vi.fn()
}));
vi.mock("./frameCache", () => ({
  getFrameFromCache: vi.fn(),
  saveFrameToCache: vi.fn()
}));
vi.mock("./getCachedVideoBlob", () => ({
  getCachedVideoBlob: vi.fn()
}));

vi.mock("./cacheStorage", () => ({ cacheGet: vi.fn() }));

import { extractFrameFromVideo } from "@app/services/mediaBunny";

import { cacheGet } from "./cacheStorage";
import { getFrameFromCache, saveFrameToCache } from "./frameCache";
import { getCachedVideoBlob } from "./getCachedVideoBlob";
import { resolveCachedVideoPreview } from "./resolveCachedVideoPreview";

const extractFrameMock = extractFrameFromVideo as unknown as ReturnType<
  typeof vi.fn
>;
const getFrameFromCacheMock = getFrameFromCache as unknown as ReturnType<
  typeof vi.fn
>;
const saveFrameToCacheMock = saveFrameToCache as unknown as ReturnType<
  typeof vi.fn
>;
const getCachedVideoBlobMock = getCachedVideoBlob as unknown as ReturnType<
  typeof vi.fn
>;

const ASSET_ID = "asset-1";
const VIDEO_URL = "https://cdn.example.com/shot.mp4";
const FPS = 24;
const FIRST_FRAME_DATA_URL = "data:image/jpeg;base64,first";
const OBJECT_URL = "blob:cached-shot";

afterEach(() => vi.restoreAllMocks());

describe("resolveCachedVideoPreview", () => {
  it.each([
    "mago-media://asset/video-1",
    "mago-media://script-project/video-1"
  ])(
    "reads a disk video directly without waiting for the download queue (%s)",
    async (videoUrl) => {
      getFrameFromCacheMock.mockResolvedValue(null);
      getCachedVideoBlobMock.mockReturnValue(new Promise(() => {}));
      extractFrameMock.mockResolvedValue(FIRST_FRAME_DATA_URL);
      expect(
        await resolveCachedVideoPreview({
          assetId: ASSET_ID,
          videoUrl,
          fps: FPS
        })
      ).toEqual({
        videoObjectUrl: videoUrl,
        firstFrameUrl: FIRST_FRAME_DATA_URL,
        isVideoAvailable: true
      });
      expect(extractFrameMock).toHaveBeenCalledWith({
        videoSource: videoUrl,
        frameNumber: 0,
        fps: FPS
      });
      expect(getCachedVideoBlobMock).not.toHaveBeenCalled();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    }
  );

  it("recognizes browser-cached video bytes even for thumbnail-only reads", async () => {
    getFrameFromCacheMock.mockResolvedValue(FIRST_FRAME_DATA_URL);
    vi.mocked(cacheGet).mockResolvedValue(videoBlob);
    const preview = await resolveCachedVideoPreview({
      assetId: ASSET_ID,
      videoUrl: VIDEO_URL,
      fps: FPS,
      loadVideo: false
    });
    expect(preview.isVideoAvailable).toBe(true);
    expect(getCachedVideoBlobMock).not.toHaveBeenCalled();
  });

  it("keeps cloud-storage proxy transfers in the download path", async () => {
    getFrameFromCacheMock.mockResolvedValue(FIRST_FRAME_DATA_URL);
    const videoUrl =
      "mago-media://cloud-storage/?url=https%3A%2F%2Fcdn.example%2Fvideo.mp4";
    await resolveCachedVideoPreview({ assetId: ASSET_ID, videoUrl, fps: FPS });
    expect(getCachedVideoBlobMock).toHaveBeenCalledWith(videoUrl, ASSET_ID);
  });
  let videoBlob: Blob;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(cacheGet).mockReset().mockResolvedValue(undefined);
    extractFrameMock.mockReset();
    getFrameFromCacheMock.mockReset();
    saveFrameToCacheMock.mockReset();
    getCachedVideoBlobMock.mockReset();
    videoBlob = new Blob(["bytes"], { type: "video/mp4" });
    getCachedVideoBlobMock.mockResolvedValue(videoBlob);
    saveFrameToCacheMock.mockResolvedValue(undefined);
    vi.spyOn(URL, "createObjectURL").mockReturnValue(OBJECT_URL);
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  it("caches the video under the asset id, not the reissuable URL", async () => {
    getFrameFromCacheMock.mockResolvedValueOnce(FIRST_FRAME_DATA_URL);

    await resolveCachedVideoPreview({
      assetId: ASSET_ID,
      videoUrl: VIDEO_URL,
      fps: FPS
    });

    expect(getCachedVideoBlobMock).toHaveBeenCalledWith(VIDEO_URL, ASSET_ID);
  });

  it("returns the cached first frame without decoding the video again", async () => {
    getFrameFromCacheMock.mockResolvedValueOnce(FIRST_FRAME_DATA_URL);

    const preview = await resolveCachedVideoPreview({
      assetId: ASSET_ID,
      videoUrl: VIDEO_URL,
      fps: FPS
    });

    expect(preview).toEqual({
      videoObjectUrl: OBJECT_URL,
      firstFrameUrl: FIRST_FRAME_DATA_URL,
      isVideoAvailable: true
    });
    expect(extractFrameMock).not.toHaveBeenCalled();
    expect(saveFrameToCacheMock).not.toHaveBeenCalled();
  });

  it("returns a persisted thumbnail without loading the video for a thumbnail-only request", async () => {
    getFrameFromCacheMock.mockResolvedValueOnce(FIRST_FRAME_DATA_URL);

    const preview = await resolveCachedVideoPreview({
      assetId: ASSET_ID,
      videoUrl: VIDEO_URL,
      fps: FPS,
      loadVideo: false
    });

    expect(preview).toEqual({
      videoObjectUrl: null,
      firstFrameUrl: FIRST_FRAME_DATA_URL,
      isVideoAvailable: false
    });
    expect(getCachedVideoBlobMock).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(extractFrameMock).not.toHaveBeenCalled();
  });

  it("persists a missing thumbnail without creating a playable video URL", async () => {
    getFrameFromCacheMock.mockResolvedValueOnce(null);
    extractFrameMock.mockResolvedValueOnce(FIRST_FRAME_DATA_URL);

    const preview = await resolveCachedVideoPreview({
      assetId: ASSET_ID,
      videoUrl: VIDEO_URL,
      fps: FPS,
      loadVideo: false
    });

    expect(preview).toEqual({
      videoObjectUrl: null,
      firstFrameUrl: FIRST_FRAME_DATA_URL,
      isVideoAvailable: true
    });
    expect(getCachedVideoBlobMock).toHaveBeenCalledOnce();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(saveFrameToCacheMock).toHaveBeenCalledWith(
      ASSET_ID,
      0,
      FIRST_FRAME_DATA_URL,
      FPS
    );
  });

  it("extracts the first frame from the blob on a cache miss and stores it", async () => {
    getFrameFromCacheMock.mockResolvedValueOnce(null);
    extractFrameMock.mockResolvedValueOnce(FIRST_FRAME_DATA_URL);

    const preview = await resolveCachedVideoPreview({
      assetId: ASSET_ID,
      videoUrl: VIDEO_URL,
      fps: FPS
    });

    expect(extractFrameMock).toHaveBeenCalledWith({
      videoSource: videoBlob,
      frameNumber: 0,
      fps: FPS
    });
    expect(saveFrameToCacheMock).toHaveBeenCalledWith(
      ASSET_ID,
      0,
      FIRST_FRAME_DATA_URL,
      FPS
    );
    expect(preview.firstFrameUrl).toBe(FIRST_FRAME_DATA_URL);
  });

  it("still returns the video when the frame cannot be decoded", async () => {
    getFrameFromCacheMock.mockResolvedValueOnce(null);
    extractFrameMock.mockRejectedValueOnce(
      new Error("Video codec not supported by browser")
    );

    const preview = await resolveCachedVideoPreview({
      assetId: ASSET_ID,
      videoUrl: VIDEO_URL,
      fps: FPS
    });

    expect(preview).toEqual({
      videoObjectUrl: OBJECT_URL,
      firstFrameUrl: null,
      isVideoAvailable: true
    });
  });
});
