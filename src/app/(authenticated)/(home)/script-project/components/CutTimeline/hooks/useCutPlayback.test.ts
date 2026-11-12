// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useCutPlayback } from "./useCutPlayback";

const clips = [
  {
    timelineId: "timeline-1",
    sequenceId: 1,
    shotIndex: 0,
    heading: "First",
    posterUrl: null,
    videoUrl: "asset://first",
    assetId: "first",
    versionAssetId: "first",
    isClipRendering: false,
    isClipPlayable: true,
    doesClipHaveRender: true,
    hasClipRenderFailed: false,
    isClipDurationMeasured: true,
    durationFrames: 100,
    startFrame: 0
  },
  {
    timelineId: "timeline-2",
    sequenceId: 2,
    shotIndex: 0,
    heading: "Second",
    posterUrl: null,
    videoUrl: "asset://second",
    assetId: "second",
    versionAssetId: "second",
    isClipRendering: false,
    isClipPlayable: true,
    doesClipHaveRender: true,
    hasClipRenderFailed: false,
    isClipDurationMeasured: true,
    durationFrames: 100,
    startFrame: 100
  }
];

const makeVideo = () => {
  const video = document.createElement("video");
  Object.defineProperty(video, "readyState", { configurable: true, value: 1 });
  Object.defineProperty(video, "play", {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined)
  });
  Object.defineProperty(video, "pause", {
    configurable: true,
    value: vi.fn()
  });
  return video;
};

describe("useCutPlayback", () => {
  it("plays from the selected playhead frame instead of restarting the clip", () => {
    const { result } = renderHook(() =>
      useCutPlayback({ clips, totalDurationFrames: 200 })
    );
    const video = makeVideo();

    act(() => result.current.registerClipVideoElement(0, video));
    act(() => result.current.seekCutToPercent(25));
    expect(video.currentTime).toBeCloseTo(50 / 24);

    act(() => result.current.toggleCutPlayback());

    expect(video.currentTime).toBeCloseTo(50 / 24);
    expect(video.play).toHaveBeenCalledOnce();
  });

  it("applies a scrubbed frame when its clip mounts after the seek", () => {
    const { result } = renderHook(() =>
      useCutPlayback({ clips, totalDurationFrames: 200 })
    );

    act(() => result.current.seekCutToPercent(75));
    expect(result.current.activeClipIndex).toBe(1);

    const video = makeVideo();
    act(() => result.current.registerClipVideoElement(1, video));

    expect(video.currentTime).toBeCloseTo(50 / 24);
    expect(video.play).not.toHaveBeenCalled();
  });
});
