import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useShotVersionComments } from "./useShotVersionComments";

describe("useShotVersionComments scoring review", () => {
  beforeEach(() => window.localStorage.clear());

  it("appends the scoring issues and suggestion under an automatic review heading", () => {
    const { result } = renderHook(() => useShotVersionComments("project-1"));

    act(() => {
      result.current.setVersionComment("version-2", "bad", "Too dark.");
      result.current.appendScoringReview(
        "version-2",
        ["Coat changes colour", "Door opens twice"],
        "Keep the coat grey."
      );
    });

    expect(result.current.commentsByAssetId["version-2"]).toEqual({
      good: "",
      bad: "Too dark.\n\n--automatic review--\nCoat changes colour\nDoor opens twice",
      todo: "--automatic review--\nKeep the coat grey."
    });
  });

  it("keeps a user's notes typed before scoring and appends the review after them", () => {
    const { result } = renderHook(() => useShotVersionComments("project-1"));

    act(() => {
      result.current.setVersionComment("version-2", "bad", "Too dark.");
      result.current.setVersionComment("version-2", "todo", "Try dusk light.");
      result.current.appendScoringReview(
        "version-2",
        ["Coat changes colour"],
        "Keep the coat grey."
      );
    });

    expect(result.current.commentsByAssetId["version-2"]).toEqual({
      good: "",
      bad: "Too dark.\n\n--automatic review--\nCoat changes colour",
      todo: "Try dusk light.\n\n--automatic review--\nKeep the coat grey."
    });
  });

  it("appends a later scoring result instead of replacing the earlier one", () => {
    const { result } = renderHook(() => useShotVersionComments("project-1"));

    act(() => {
      result.current.appendScoringReview(
        "version-2",
        ["Door opens twice"],
        null
      );
      result.current.appendScoringReview("version-2", ["Rain stops"], null);
    });

    expect(result.current.commentsByAssetId["version-2"]?.bad).toBe(
      "--automatic review--\nDoor opens twice\n\n--automatic review--\nRain stops"
    );
  });

  it("writes the same scoring result only once", () => {
    const { result } = renderHook(() => useShotVersionComments("project-1"));

    act(() => {
      result.current.appendScoringReview(
        "version-2",
        ["Door opens twice"],
        null
      );
      result.current.appendScoringReview(
        "version-2",
        ["Door opens twice"],
        null
      );
    });

    expect(result.current.commentsByAssetId["version-2"]?.bad).toBe(
      "--automatic review--\nDoor opens twice"
    );
  });
});
