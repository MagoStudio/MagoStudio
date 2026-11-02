import { CutTimelineClip } from "@domains/scriptProject/utils/buildCutTimelineClips";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useCutPlayback } from "./useCutPlayback";

const clips: CutTimelineClip[] = [0, 1].map((index) => ({
  timelineId: `shot-${index}`,
  sequenceId: index,
  shotIndex: index,
  heading: null,
  posterUrl: null,
  videoUrl: "https://example.com/video.mp4",
  assetId: `take-${index}`,
  isClipPlayable: true,
  doesClipHaveRender: true,
  hasClipRenderFailed: false,
  isClipDurationMeasured: true,
  durationFrames: 120,
  startFrame: index * 120
}));
const video = () =>
  ({
    currentTime: 0,
    readyState: 1,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn()
  }) as unknown as HTMLVideoElement;

describe("cut playback position", () => {
  it("applies the selected position when an already mounted video finishes loading", () => {
    const { result } = renderHook(() =>
      useCutPlayback({ clips, totalDurationFrames: 240 })
    );
    const first = document.createElement("video");
    Object.defineProperty(first, "readyState", {
      value: 0,
      configurable: true
    });
    const play = vi.spyOn(first, "play").mockResolvedValue(undefined);
    act(() => result.current.registerClipVideoElement(0, first));
    act(() => result.current.seekCutToPercent(25));
    act(() => result.current.toggleCutPlayback());
    Object.defineProperty(first, "readyState", { value: 1 });
    act(() => {
      first.dispatchEvent(new Event("loadedmetadata"));
    });
    expect(first.currentTime).toBe(2.5);
    expect(play).toHaveBeenCalledOnce();
  });
  it("does not seek or restart playback when metadata arrives after unmount", () => {
    const { result, unmount } = renderHook(() =>
      useCutPlayback({ clips, totalDurationFrames: 240 })
    );
    const first = document.createElement("video");
    Object.defineProperty(first, "readyState", { value: 0 });
    const play = vi.spyOn(first, "play").mockResolvedValue(undefined);
    const removeListener = vi.spyOn(first, "removeEventListener");
    act(() => result.current.registerClipVideoElement(0, first));
    act(() => result.current.seekCutToPercent(25));
    act(() => result.current.toggleCutPlayback());
    unmount();
    first.dispatchEvent(new Event("loadedmetadata"));
    expect(play).not.toHaveBeenCalled();
    expect(first.currentTime).toBe(0);
    expect(removeListener).toHaveBeenCalledWith(
      "loadedmetadata",
      expect.any(Function)
    );
  });
  it("retains the pending seek for a replacement video and ignores the detached one", () => {
    const { result } = renderHook(() =>
      useCutPlayback({ clips, totalDurationFrames: 240 })
    );
    const first = document.createElement("video");
    const replacement = document.createElement("video");
    Object.defineProperty(first, "readyState", { value: 0 });
    Object.defineProperty(replacement, "readyState", { value: 0 });
    const firstPlay = vi.spyOn(first, "play").mockResolvedValue(undefined);
    const replacementPlay = vi
      .spyOn(replacement, "play")
      .mockResolvedValue(undefined);
    act(() => result.current.registerClipVideoElement(0, first));
    act(() => result.current.seekCutToPercent(25));
    act(() => result.current.toggleCutPlayback());
    act(() => {
      result.current.registerClipVideoElement(0, null);
      result.current.registerClipVideoElement(0, replacement);
      first.dispatchEvent(new Event("loadedmetadata"));
      replacement.dispatchEvent(new Event("loadedmetadata"));
    });
    expect(firstPlay).not.toHaveBeenCalled();
    expect(first.currentTime).toBe(0);
    expect(replacementPlay).toHaveBeenCalledOnce();
    expect(replacement.currentTime).toBe(2.5);
  });
  it("starts from a scrubbed position and resumes after pausing", () => {
    const { result } = renderHook(() =>
      useCutPlayback({ clips, totalDurationFrames: 240 })
    );
    const first = video();
    act(() => result.current.registerClipVideoElement(0, first));
    act(() => result.current.seekCutToPercent(25));
    act(() => result.current.toggleCutPlayback());
    expect(first.currentTime).toBe(2.5);
    first.currentTime = 3;
    act(() => result.current.toggleCutPlayback());
    act(() => result.current.toggleCutPlayback());
    expect(first.currentTime).toBe(3);
  });
  it("retains a seek across a clip that has not mounted yet", () => {
    const { result } = renderHook(() =>
      useCutPlayback({ clips, totalDurationFrames: 240 })
    );
    act(() => result.current.seekCutToPercent(75));
    const second = video();
    act(() => result.current.registerClipVideoElement(1, second));
    expect(second.currentTime).toBe(2.5);
    act(() => result.current.toggleCutPlayback());
    expect(second.currentTime).toBe(2.5);
  });
  it("pauses the previous clip when scrubbing across shots during playback", () => {
    const { result } = renderHook(() =>
      useCutPlayback({ clips, totalDurationFrames: 240 })
    );
    const first = video(),
      second = video();
    act(() => {
      result.current.registerClipVideoElement(0, first);
      result.current.registerClipVideoElement(1, second);
    });
    act(() => result.current.toggleCutPlayback());
    act(() => result.current.seekCutToPercent(75));
    expect(first.pause).toHaveBeenCalled();
    expect(second.play).toHaveBeenCalled();
    expect(second.currentTime).toBe(2.5);
  });
});
