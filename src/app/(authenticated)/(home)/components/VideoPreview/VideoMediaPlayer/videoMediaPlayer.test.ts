import {
  getSelectedTracksIntersection,
  isFrameWithinPlayableRange
} from "@utils";
import { describe, test, expect } from "vitest";

import {
  calculateVideoTime,
  getVideoStartTime,
  getVideoEndTime
} from "./index";

describe("getSelectedTracksIntersection", () => {
  const createLayer = (id: string, start: number, duration: number) => ({
    id,
    clips: [
      {
        data: { timeline_offset: start },
        asset: { data: { duration } }
      }
    ]
  });

  const createEmptyLayer = (id: string) => ({ id, clips: [] });

  const testCases = [
    {
      name: "Two overlapping tracks: [0-24], [20-44] → intersection [20-24]",
      layers: [createLayer("1", 0, 24), createLayer("2", 20, 24)],
      expected: [20, 24]
    },
    {
      name: "Track + null: [0-24], null → intersection [0-24]",
      layers: [createLayer("1", 0, 24), createEmptyLayer("2")],
      expected: [0, 24]
    },
    {
      name: "No overlap: [0-24], [28-52] → null (no intersection)",
      layers: [createLayer("1", 0, 24), createLayer("2", 28, 24)],
      expected: null
    },
    {
      name: "Touching ranges: [0-24], [24-48] → intersection [24-24]",
      layers: [createLayer("1", 0, 24), createLayer("2", 24, 24)],
      expected: [24, 24]
    },
    {
      name: "Three overlapping tracks: [0-24], [12-36], [20-44] → intersection [20-24]",
      layers: [
        createLayer("1", 0, 24),
        createLayer("2", 12, 24),
        createLayer("3", 20, 24)
      ],
      expected: [20, 24]
    },
    {
      name: "Two tracks + null: [0-24], [12-36], null → intersection [12-24]",
      layers: [
        createLayer("1", 0, 24),
        createLayer("2", 12, 24),
        createEmptyLayer("3")
      ],
      expected: [12, 24]
    },
    {
      name: "Four overlapping tracks: [0-24], [12-36], [16-40], [20-44] → intersection [20-24]",
      layers: [
        createLayer("1", 0, 24),
        createLayer("2", 12, 24),
        createLayer("3", 16, 24),
        createLayer("4", 20, 24)
      ],
      expected: [20, 24]
    },
    {
      name: "Same start, different durations: [0-100], [0-50] → intersection [0-50]",
      layers: [createLayer("1", 0, 100), createLayer("2", 0, 50)],
      expected: [0, 50]
    },
    {
      name: "Single track: [0-24] → intersection [0-24]",
      layers: [createLayer("1", 0, 24)],
      expected: [0, 24]
    },
    {
      name: "Empty array → null",
      layers: [],
      expected: null
    }
  ];

  test.each(testCases)("$name", ({ layers, expected }) => {
    expect(getSelectedTracksIntersection(layers as any)).toEqual(expected);
  });
});

describe("isFrameWithinPlayableRange", () => {
  const frameRangeTestCases = [
    {
      name: "Frame 22 inside playable range [20-24]",
      frame: 22,
      clipOffset: 0,
      clipDuration: 24,
      globalStart: 20,
      globalEnd: 24,
      expected: true
    },
    {
      name: "Frame 20 at start of playable range [20-24]",
      frame: 20,
      clipOffset: 0,
      clipDuration: 24,
      globalStart: 20,
      globalEnd: 24,
      expected: true
    },
    {
      name: "Frame 24 at end of playable range [20-24]",
      frame: 24,
      clipOffset: 0,
      clipDuration: 24,
      globalStart: 20,
      globalEnd: 24,
      expected: true
    },
    {
      name: "Frame 19 before playable range [20-24]",
      frame: 19,
      clipOffset: 0,
      clipDuration: 24,
      globalStart: 20,
      globalEnd: 24,
      expected: false
    },
    {
      name: "Frame 25 after playable range [20-24]",
      frame: 25,
      clipOffset: 0,
      clipDuration: 24,
      globalStart: 20,
      globalEnd: 24,
      expected: false
    },
    {
      name: "Frame in clip but not in global range",
      frame: 10,
      clipOffset: 0,
      clipDuration: 24,
      globalStart: 20,
      globalEnd: 24,
      expected: false
    },
    {
      name: "Single frame range [20-20] - frame 20 should be within range",
      frame: 20,
      clipOffset: 0,
      clipDuration: 24,
      globalStart: 20,
      globalEnd: 20,
      expected: true
    }
  ];

  test.each(frameRangeTestCases)(
    "$name",
    ({ frame, clipOffset, clipDuration, globalStart, globalEnd, expected }) => {
      expect(
        isFrameWithinPlayableRange(
          frame,
          clipOffset,
          clipDuration,
          globalStart,
          globalEnd
        )
      ).toBe(expected);
    }
  );
});

describe("Video loop behavior", () => {
  const FPS = 30;

  const shouldSkipSyncing = (
    isPlaying: boolean,
    currentVideoTime: number,
    startTime: number,
    isLoopingBack: boolean,
    hasExceededEndTime: boolean
  ): boolean => {
    return (
      isPlaying &&
      currentVideoTime > startTime &&
      !isLoopingBack &&
      !hasExceededEndTime
    );
  };

  test("When frame loops back to startFrame, video should sync to startTime even when startFrame > 0", () => {
    const clipOffsetFrames = 0;
    const clipDurationFrames = 100;
    const globalStart = 10;
    const globalEnd = 50;
    const isPlaying = true;

    const startTime = getVideoStartTime(clipOffsetFrames, globalStart, FPS);

    const endFrame = globalEnd;
    const loopedBackFrame = globalStart;

    const currentVideoTime = calculateVideoTime(
      loopedBackFrame,
      clipOffsetFrames,
      FPS
    );
    const isLoopingBack = loopedBackFrame === globalStart;
    const hasExceededEndTime = false;

    const shouldSkip = shouldSkipSyncing(
      isPlaying,
      currentVideoTime,
      startTime,
      isLoopingBack,
      hasExceededEndTime
    );

    expect(shouldSkip).toBe(false);
    expect(currentVideoTime).toBe(startTime);
    expect(isLoopingBack).toBe(true);
  });

  test("When video currentTime exceeds endTime during playback, it should be reset", () => {
    const clipOffsetFrames = 0;
    const clipDurationFrames = 100;
    const globalStart = 10;
    const globalEnd = 50;
    const isPlaying = true;

    const startTime = getVideoStartTime(clipOffsetFrames, globalStart, FPS);
    const endTime = getVideoEndTime(
      clipOffsetFrames,
      clipDurationFrames,
      globalEnd,
      FPS
    );

    const currentVideoFrame: number = 49;
    const videoElementCurrentTime = endTime + 0.5;

    const currentVideoTime = calculateVideoTime(
      currentVideoFrame,
      clipOffsetFrames,
      FPS
    );
    const isLoopingBack: boolean = currentVideoFrame === globalStart;
    const hasExceededEndTime = videoElementCurrentTime >= endTime;

    const shouldSkip = shouldSkipSyncing(
      isPlaying,
      currentVideoTime,
      startTime,
      isLoopingBack,
      hasExceededEndTime
    );

    expect(shouldSkip).toBe(false);
    expect(hasExceededEndTime).toBe(true);
  });

  test("During normal playback (not looping, not exceeded), sync should be skipped", () => {
    const clipOffsetFrames = 0;
    const clipDurationFrames = 100;
    const globalStart = 10;
    const globalEnd = 50;
    const isPlaying = true;

    const startTime = getVideoStartTime(clipOffsetFrames, globalStart, FPS);
    const endTime = getVideoEndTime(
      clipOffsetFrames,
      clipDurationFrames,
      globalEnd,
      FPS
    );

    const currentVideoFrame: number = 30;
    const videoElementCurrentTime = calculateVideoTime(
      currentVideoFrame,
      clipOffsetFrames,
      FPS
    );

    const currentVideoTime = calculateVideoTime(
      currentVideoFrame,
      clipOffsetFrames,
      FPS
    );
    const isLoopingBack: boolean = currentVideoFrame === globalStart;
    const hasExceededEndTime = videoElementCurrentTime >= endTime;

    const shouldSkip = shouldSkipSyncing(
      isPlaying,
      currentVideoTime,
      startTime,
      isLoopingBack,
      hasExceededEndTime
    );

    expect(shouldSkip).toBe(true);
    expect(isLoopingBack).toBe(false);
    expect(hasExceededEndTime).toBe(false);
  });

  test("When startFrame = 0, loop behavior should work correctly", () => {
    const clipOffsetFrames = 0;
    const clipDurationFrames = 100;
    const globalStart = 0;
    const globalEnd = 50;
    const isPlaying = true;

    const startTime = getVideoStartTime(clipOffsetFrames, globalStart, FPS);
    const endTime = getVideoEndTime(
      clipOffsetFrames,
      clipDurationFrames,
      globalEnd,
      FPS
    );

    const loopedBackFrame = globalStart;
    const currentVideoTime = calculateVideoTime(
      loopedBackFrame,
      clipOffsetFrames,
      FPS
    );
    const isLoopingBack = loopedBackFrame === globalStart;

    expect(currentVideoTime).toBe(0);
    expect(startTime).toBe(0);
    expect(isLoopingBack).toBe(true);
  });
});
