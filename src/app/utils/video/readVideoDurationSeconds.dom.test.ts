import { beforeEach, describe, expect, it, vi } from "vitest";

import { readVideoDurationSeconds } from "./readVideoDurationSeconds";

const VIDEO_URL = "https://example.com/shot.mp4";

describe("readVideoDurationSeconds", () => {
  let mockVideo: HTMLVideoElement;
  let listeners: Record<string, () => void>;

  const fireLoadedMetadataWith = (duration: number) => {
    Object.defineProperty(mockVideo, "duration", {
      value: duration,
      configurable: true
    });
    listeners.loadedmetadata?.();
  };

  beforeEach(() => {
    listeners = {};

    mockVideo = {
      preload: "",
      src: "",
      duration: 0,
      load: vi.fn(),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        listeners[event] = handler;
      }),
      removeEventListener: vi.fn((event: string) => {
        delete listeners[event];
      })
    } as unknown as HTMLVideoElement;

    vi.spyOn(document, "createElement").mockImplementation(((
      tagName: string
    ) =>
      tagName === "video"
        ? mockVideo
        : ({} as unknown as HTMLElement)) as never);
  });

  it("reports the duration the browser read from the metadata", async () => {
    const durationSeconds = readVideoDurationSeconds(VIDEO_URL);
    fireLoadedMetadataWith(3.25);

    await expect(durationSeconds).resolves.toBe(3.25);
  });

  it("asks only for metadata, not for the whole file", () => {
    void readVideoDurationSeconds(VIDEO_URL).catch(() => undefined);
    fireLoadedMetadataWith(3);

    expect(mockVideo.preload).toBe("metadata");
  });

  it("refuses a duration it cannot lay out with", async () => {
    const infiniteDuration = readVideoDurationSeconds(VIDEO_URL);
    fireLoadedMetadataWith(Infinity);
    await expect(infiniteDuration).rejects.toThrow("unusable duration");

    const zeroDuration = readVideoDurationSeconds(VIDEO_URL);
    fireLoadedMetadataWith(0);
    await expect(zeroDuration).rejects.toThrow("unusable duration");
  });

  it("rejects when the video fails to load", async () => {
    const durationSeconds = readVideoDurationSeconds(VIDEO_URL);
    listeners.error?.();

    await expect(durationSeconds).rejects.toThrow(
      "Could not read the duration"
    );
  });

  it("detaches the source so a pending request cannot outlive the probe", async () => {
    const durationSeconds = readVideoDurationSeconds(VIDEO_URL);
    fireLoadedMetadataWith(3);
    await durationSeconds;

    expect(mockVideo.src).toBe("");
    expect(mockVideo.removeEventListener).toHaveBeenCalledWith(
      "loadedmetadata",
      expect.any(Function)
    );
  });
});
