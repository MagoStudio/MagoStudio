import { beforeEach, describe, expect, it, vi } from "vitest";

import { captureFrameFromVideoElement } from "./captureFrameFromVideoElement";

describe("captureFrameFromVideoElement", () => {
  const frameBlob = new Blob(["frame"], { type: "image/png" });
  const drawImage = vi.fn();
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ({ drawImage })),
    toBlob: vi.fn((callback: BlobCallback) => callback(frameBlob))
  } as unknown as HTMLCanvasElement;
  const video = {
    videoWidth: 1920,
    videoHeight: 1080
  } as HTMLVideoElement;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(document, "createElement").mockImplementation(
      (() => canvas) as unknown as typeof document.createElement
    );
  });

  it("captures the currently displayed video frame as a PNG", async () => {
    const result = await captureFrameFromVideoElement({
      videoElement: video,
      imageFormat: "image/png"
    });

    expect(result).toBe(frameBlob);
    expect(canvas.width).toBe(1920);
    expect(canvas.height).toBe(1080);
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 1920, 1080);
    expect(canvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      "image/png",
      0.95
    );
  });

  it("rejects when canvas conversion fails", async () => {
    canvas.toBlob = vi.fn((callback: BlobCallback) => callback(null));

    await expect(
      captureFrameFromVideoElement({ videoElement: video })
    ).rejects.toThrow("Failed to convert canvas to blob");
  });
});
