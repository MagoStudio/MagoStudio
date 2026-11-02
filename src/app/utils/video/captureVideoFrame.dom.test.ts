import { describe, it, expect, beforeEach, vi } from "vitest";

import { captureVideoFrame } from "./captureVideoFrame";

describe("captureVideoFrame", () => {
  let mockVideo: HTMLVideoElement;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    mockContext = {
      drawImage: vi.fn()
    } as unknown as CanvasRenderingContext2D;

    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext),
      toDataURL: vi.fn(() => "data:image/jpeg;base64,mockedImageData")
    } as unknown as HTMLCanvasElement;

    mockVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
      currentTime: 0,
      crossOrigin: "",
      src: "",
      load: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    } as unknown as HTMLVideoElement;

    vi.spyOn(document, "createElement").mockImplementation(((
      tagName: string
    ) => {
      if (tagName === "video") {
        return mockVideo;
      }
      if (tagName === "canvas") {
        return mockCanvas;
      }
      return document.createElement(tagName);
    }) as typeof document.createElement);
  });

  it("should capture a video frame at the specified frame number", async () => {
    const videoUrl = "https://example.com/video.mp4";
    const frame = 30;
    const fps = 30;

    const capturePromise = captureVideoFrame({ videoUrl, frame, fps });

    const loadedMetadataHandler = (
      mockVideo.addEventListener as any
    ).mock.calls.find((call: any) => call[0] === "loadedmetadata")?.[1];
    loadedMetadataHandler?.();

    const seekedHandler = (mockVideo.addEventListener as any).mock.calls.find(
      (call: any) => call[0] === "seeked"
    )?.[1];
    seekedHandler?.();

    const result = await capturePromise;

    expect(result).toBe("data:image/jpeg;base64,mockedImageData");
    expect(mockVideo.crossOrigin).toBe("anonymous");
    expect(mockVideo.src).toBe(videoUrl);
    expect(mockVideo.currentTime).toBe(1);
    expect(mockCanvas.width).toBe(1920);
    expect(mockCanvas.height).toBe(1080);
    expect(mockContext.drawImage).toHaveBeenCalledWith(
      mockVideo,
      0,
      0,
      1920,
      1080
    );
    expect(mockCanvas.toDataURL).toHaveBeenCalledWith("image/jpeg", 0.95);
  });

  it("should use custom image format and quality", async () => {
    const videoUrl = "https://example.com/video.mp4";
    const frame = 15;
    const fps = 30;
    const imageFormat = "image/png" as const;
    const imageQuality = 0.8;

    const capturePromise = captureVideoFrame({
      videoUrl,
      frame,
      fps,
      imageFormat,
      imageQuality
    });

    const loadedMetadataHandler = (
      mockVideo.addEventListener as any
    ).mock.calls.find((call: any) => call[0] === "loadedmetadata")?.[1];
    loadedMetadataHandler?.();

    const seekedHandler = (mockVideo.addEventListener as any).mock.calls.find(
      (call: any) => call[0] === "seeked"
    )?.[1];
    seekedHandler?.();

    await capturePromise;

    expect(mockCanvas.toDataURL).toHaveBeenCalledWith(
      imageFormat,
      imageQuality
    );
  });

  it("should reject when canvas context cannot be created", async () => {
    const nullContextCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => null),
      toDataURL: vi.fn(() => "data:image/jpeg;base64,mockedImageData")
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, "createElement").mockImplementation(((
      tagName: string
    ) => {
      if (tagName === "canvas") {
        return nullContextCanvas;
      }
      if (tagName === "video") {
        return mockVideo;
      }
      return document.createElement(tagName);
    }) as typeof document.createElement);

    const videoUrl = "https://example.com/video.mp4";
    const frame = 30;

    await expect(
      captureVideoFrame({ videoUrl, frame, fps: 30 })
    ).rejects.toThrow("Could not get canvas context");
  });

  it("should reject when video fails to load", async () => {
    const videoUrl = "https://example.com/invalid-video.mp4";
    const frame = 30;
    const fps = 30;

    const capturePromise = captureVideoFrame({ videoUrl, frame, fps });

    const errorHandler = (mockVideo.addEventListener as any).mock.calls.find(
      (call: any) => call[0] === "error"
    )?.[1];
    const mockError = new Event("error");
    errorHandler?.(mockError);

    await expect(capturePromise).rejects.toThrow("Error loading video: error");
  });

  it("should use default fps when not provided", async () => {
    const videoUrl = "https://example.com/video.mp4";
    const frame = 60;

    const capturePromise = captureVideoFrame({ videoUrl, frame });

    const loadedMetadataHandler = (
      mockVideo.addEventListener as any
    ).mock.calls.find((call: any) => call[0] === "loadedmetadata")?.[1];
    loadedMetadataHandler?.();

    const seekedHandler = (mockVideo.addEventListener as any).mock.calls.find(
      (call: any) => call[0] === "seeked"
    )?.[1];
    seekedHandler?.();

    await capturePromise;

    expect(mockVideo.currentTime).toBe(2);
  });

  it("should calculate correct time for different fps values", async () => {
    const videoUrl = "https://example.com/video.mp4";
    const frame = 60;
    const fps = 60;

    const capturePromise = captureVideoFrame({ videoUrl, frame, fps });

    const loadedMetadataHandler = (
      mockVideo.addEventListener as any
    ).mock.calls.find((call: any) => call[0] === "loadedmetadata")?.[1];
    loadedMetadataHandler?.();

    const seekedHandler = (mockVideo.addEventListener as any).mock.calls.find(
      (call: any) => call[0] === "seeked"
    )?.[1];
    seekedHandler?.();

    await capturePromise;

    expect(mockVideo.currentTime).toBe(1);
  });

  it("should clean up event listeners on success", async () => {
    const videoUrl = "https://example.com/video.mp4";
    const frame = 30;

    const capturePromise = captureVideoFrame({ videoUrl, frame, fps: 30 });

    const loadedMetadataHandler = (
      mockVideo.addEventListener as any
    ).mock.calls.find((call: any) => call[0] === "loadedmetadata")?.[1];
    loadedMetadataHandler?.();

    const seekedHandler = (mockVideo.addEventListener as any).mock.calls.find(
      (call: any) => call[0] === "seeked"
    )?.[1];
    seekedHandler?.();

    await capturePromise;

    expect(mockVideo.removeEventListener).toHaveBeenCalledWith(
      "loadedmetadata",
      expect.any(Function)
    );
    expect(mockVideo.removeEventListener).toHaveBeenCalledWith(
      "seeked",
      expect.any(Function)
    );
    expect(mockVideo.removeEventListener).toHaveBeenCalledWith(
      "error",
      expect.any(Function)
    );
  });

  it("should clean up event listeners on error", async () => {
    const videoUrl = "https://example.com/video.mp4";
    const frame = 30;

    const capturePromise = captureVideoFrame({ videoUrl, frame, fps: 30 });

    const errorHandler = (mockVideo.addEventListener as any).mock.calls.find(
      (call: any) => call[0] === "error"
    )?.[1];
    errorHandler?.(new Event("error"));

    await expect(capturePromise).rejects.toThrow();

    expect(mockVideo.removeEventListener).toHaveBeenCalledWith(
      "loadedmetadata",
      expect.any(Function)
    );
    expect(mockVideo.removeEventListener).toHaveBeenCalledWith(
      "seeked",
      expect.any(Function)
    );
    expect(mockVideo.removeEventListener).toHaveBeenCalledWith(
      "error",
      expect.any(Function)
    );
  });
});
