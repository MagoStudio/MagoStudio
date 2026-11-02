import { describe, it, expect } from "vitest";

import { getNewTracksSelection } from "./getNewTracksSelection";

describe("getNewTracksSelection", () => {
  describe("single select mode (isMultiSelect = false)", () => {
    it.each([
      ["track-1", [], ["track-1"], "no tracks selected"],
      ["track-3", ["track-1", "track-2"], ["track-3"], "other tracks selected"],
      ["track-1", ["track-1"], ["track-1"], "clicking already selected track"],
      [
        "track-4",
        ["track-1", "track-2", "track-3"],
        ["track-4"],
        "multiple tracks selected"
      ]
    ])(
      "should select only clicked track (%s) when %s",
      (clickedTrack, selectedTracks, expectedResult, _description) => {
        const result = getNewTracksSelection(
          clickedTrack,
          selectedTracks,
          false
        );
        expect(result).toEqual(expectedResult);
      }
    );
  });

  describe("multi-select mode (isMultiSelect = true)", () => {
    describe("adding tracks", () => {
      it.each([
        ["track-1", [], ["track-1"]],
        ["track-3", ["track-1", "track-2"], ["track-1", "track-2", "track-3"]],
        ["track-4", ["track-1", "track-3"], ["track-1", "track-3", "track-4"]]
      ])(
        "should add %s to selection %p",
        (clickedTrack, selectedTracks, expectedResult) => {
          const result = getNewTracksSelection(
            clickedTrack,
            selectedTracks,
            true
          );
          expect(result).toEqual(expectedResult);
        }
      );
    });

    describe("removing tracks", () => {
      it.each([
        ["track-1", ["track-1"], []],
        ["track-2", ["track-1", "track-2", "track-3"], ["track-1", "track-3"]],
        [
          "track-2",
          ["track-1", "track-2", "track-3", "track-4"],
          ["track-1", "track-3", "track-4"]
        ]
      ])(
        "should remove %s from selection %p",
        (clickedTrack, selectedTracks, expectedResult) => {
          const result = getNewTracksSelection(
            clickedTrack,
            selectedTracks,
            true
          );
          expect(result).toEqual(expectedResult);
        }
      );
    });

    describe("comprehensive multi-select scenarios", () => {
      it.each([
        [
          "track-3",
          ["track-1", "track-2"],
          ["track-1", "track-2", "track-3"],
          false
        ],
        [
          "track-2",
          ["track-1", "track-2", "track-3"],
          ["track-1", "track-3"],
          true
        ],
        ["track-1", [], ["track-1"], false],
        ["track-1", ["track-1"], [], true],
        [
          "track-4",
          ["track-1", "track-3"],
          ["track-1", "track-3", "track-4"],
          false
        ],
        [
          "track-2",
          ["track-1", "track-2", "track-3", "track-4"],
          ["track-1", "track-3", "track-4"],
          true
        ]
      ])(
        "should %s track %s with initial selection %p",
        (clickedTrack, selectedTracks, expectedResult, isInSelection) => {
          const result = getNewTracksSelection(
            clickedTrack,
            selectedTracks,
            true
          );
          expect(result).toEqual(expectedResult);

          if (isInSelection) {
            expect(result).not.toContain(clickedTrack);
          } else {
            expect(result).toContain(clickedTrack);
          }
        }
      );
    });
  });

  describe("edge cases and comprehensive scenarios", () => {
    it.each([
      ["track-1", [], false, ["track-1"], "single select with no selection"],
      ["track-1", [], true, ["track-1"], "multi select with no selection"],
      [
        "track-1",
        ["track-1"],
        false,
        ["track-1"],
        "single select clicking selected"
      ],
      ["track-1", ["track-1"], true, [], "multi select deselecting last track"],
      [
        "track-5",
        ["track-1", "track-2", "track-3", "track-4"],
        false,
        ["track-5"],
        "single select replacing many"
      ],
      [
        "track-5",
        ["track-1", "track-2", "track-3", "track-4"],
        true,
        ["track-1", "track-2", "track-3", "track-4", "track-5"],
        "multi select adding to many"
      ]
    ])(
      "handles scenario: %s",
      (
        clickedTrack,
        selectedTracks,
        isMultiSelect,
        expectedResult,
        scenario
      ) => {
        const result = getNewTracksSelection(
          clickedTrack,
          selectedTracks,
          isMultiSelect
        );
        expect(result).toEqual(expectedResult);
      }
    );
  });
});
