import { PreviewMode } from "@store/atoms";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { updateViewModeIfNeeded } from "./updateViewModeIfNeeded";

describe("updateViewModeIfNeeded", () => {
  let setViewModeMock: (mode: PreviewMode) => void;

  beforeEach(() => {
    setViewModeMock = vi.fn();
  });

  describe("when 1 track is selected", () => {
    it.each([PreviewMode.SINGLE, PreviewMode.SBS, PreviewMode.TWO])(
      "should set view mode to SINGLE when previous view mode was %s",
      (previousMode) => {
        updateViewModeIfNeeded({
          newSelectedTracksCount: 1,
          viewMode: previousMode,
          setViewMode: setViewModeMock
        });

        expect(setViewModeMock).toHaveBeenCalledWith(PreviewMode.SINGLE);
        expect(setViewModeMock).toHaveBeenCalledTimes(1);
      }
    );
  });

  describe("when 2 tracks are selected", () => {
    it.each([
      [PreviewMode.SINGLE, PreviewMode.TWO, true],
      [PreviewMode.SBS, PreviewMode.TWO, true],
      [PreviewMode.TWO, null, false]
    ])(
      "should handle view mode %s correctly",
      (previousMode, expectedMode, shouldCall) => {
        updateViewModeIfNeeded({
          newSelectedTracksCount: 2,
          viewMode: previousMode,
          setViewMode: setViewModeMock
        });

        if (shouldCall) {
          expect(setViewModeMock).toHaveBeenCalledWith(expectedMode);
          expect(setViewModeMock).toHaveBeenCalledTimes(1);
        } else {
          expect(setViewModeMock).not.toHaveBeenCalled();
        }
      }
    );
  });

  describe("when other track counts are selected", () => {
    it.each([
      [0, PreviewMode.SINGLE, PreviewMode.TWO, true],
      [0, PreviewMode.SBS, PreviewMode.TWO, true],
      [0, PreviewMode.TWO, null, false],
      [3, PreviewMode.SINGLE, PreviewMode.TWO, true],
      [3, PreviewMode.SBS, PreviewMode.TWO, true],
      [3, PreviewMode.TWO, null, false],
      [4, PreviewMode.SINGLE, PreviewMode.TWO, true],
      [4, PreviewMode.SBS, PreviewMode.TWO, true],
      [4, PreviewMode.TWO, null, false],
      [5, PreviewMode.SINGLE, PreviewMode.TWO, true],
      [5, PreviewMode.SBS, PreviewMode.TWO, true],
      [5, PreviewMode.TWO, null, false],
      [10, PreviewMode.SINGLE, PreviewMode.TWO, true],
      [10, PreviewMode.SBS, PreviewMode.TWO, true],
      [10, PreviewMode.TWO, null, false]
    ])(
      "should handle %d tracks with view mode %s correctly",
      (tracksCount, previousMode, expectedMode, shouldCall) => {
        updateViewModeIfNeeded({
          newSelectedTracksCount: tracksCount,
          viewMode: previousMode,
          setViewMode: setViewModeMock
        });

        if (shouldCall) {
          expect(setViewModeMock).toHaveBeenCalledWith(expectedMode);
        } else {
          expect(setViewModeMock).not.toHaveBeenCalled();
        }
      }
    );
  });
});
