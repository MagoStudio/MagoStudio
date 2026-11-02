import { describe, expect, it, vi } from "vitest";

import { padVideoToMinDuration } from "./padVideoToMinDuration";

const computeDurationMock = vi.fn();

vi.mock("mediabunny", () => ({
  ALL_FORMATS: [],
  BlobSource: class {},
  Input: class {
    getPrimaryVideoTrack() {
      return { displayWidth: 100, displayHeight: 100 };
    }
    computeDuration() {
      return computeDurationMock();
    }
  },
  Output: class {},
  Mp4OutputFormat: class {},
  BufferTarget: class {},
  CanvasSource: class {},
  VideoSampleSink: class {},
  AudioSampleSink: class {},
  AudioBufferSource: class {}
}));

const makeFile = () =>
  new File([new Uint8Array([0])], "clip.mp4", { type: "video/mp4" });

describe("padVideoToMinDuration", () => {
  it("returns the original file untouched when already at least minSeconds", async () => {
    computeDurationMock.mockReturnValue(5);
    const file = makeFile();

    const result = await padVideoToMinDuration(file, 3.2);

    expect(result).toBe(file);
  });

  it("returns the original file when exactly minSeconds long", async () => {
    computeDurationMock.mockReturnValue(3.2);
    const file = makeFile();

    const result = await padVideoToMinDuration(file, 3.2);

    expect(result).toBe(file);
  });
});
