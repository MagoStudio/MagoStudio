import { describe, expect, it } from "vitest";

import { setSearchParam } from "./setSearchParam";

describe("setSearchParam", () => {
  it("adds a new key while preserving existing params", () => {
    const result = setSearchParam(
      "?projectId=abc&timelineId=t1",
      "selectedTrackIds",
      "track-1"
    );

    expect(result).toBe("projectId=abc&timelineId=t1&selectedTrackIds=track-1");
  });

  it("overwrites only the given key", () => {
    const result = setSearchParam(
      "?projectId=abc&timelineId=a",
      "timelineId",
      "b"
    );

    expect(result).toBe("projectId=abc&timelineId=b");
  });

  it("deletes only the given key when value is undefined", () => {
    const result = setSearchParam(
      "?projectId=abc&timelineId=a",
      "timelineId",
      undefined
    );

    expect(result).toBe("projectId=abc");
  });

  it("returns an empty string when deleting the only param", () => {
    const result = setSearchParam("?timelineId=a", "timelineId", undefined);

    expect(result).toBe("");
  });

  it("handles an empty search string by adding the key", () => {
    const result = setSearchParam("", "timelineId", "a");

    expect(result).toBe("timelineId=a");
  });

  it("handles an empty search string when deleting a key that isn't present", () => {
    const result = setSearchParam("", "timelineId", undefined);

    expect(result).toBe("");
  });

  it("works without a leading question mark", () => {
    const result = setSearchParam("projectId=abc", "timelineId", "a");

    expect(result).toBe("projectId=abc&timelineId=a");
  });

  it("round-trips a comma-joined track-ids value intact", () => {
    const result = setSearchParam(
      "?projectId=abc",
      "selectedTrackIds",
      "track-1,track-2"
    );

    expect(new URLSearchParams(result).get("selectedTrackIds")).toBe(
      "track-1,track-2"
    );
  });

  it("preserves all three params across sequential calls from the onboarding-exit shape", () => {
    const afterShotBackfill = setSearchParam(
      "?projectId=X",
      "timelineId",
      "shot1"
    );
    const afterTrackBackfill = setSearchParam(
      afterShotBackfill,
      "selectedTrackIds",
      "track-1"
    );

    const finalParams = new URLSearchParams(afterTrackBackfill);
    expect(finalParams.get("projectId")).toBe("X");
    expect(finalParams.get("timelineId")).toBe("shot1");
    expect(finalParams.get("selectedTrackIds")).toBe("track-1");
  });
});
