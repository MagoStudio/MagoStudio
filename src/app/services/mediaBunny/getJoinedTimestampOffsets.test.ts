import { describe, expect, it } from "vitest";

import { getJoinedTimestampOffsets } from "./getJoinedTimestampOffsets";

describe("getJoinedTimestampOffsets", () => {
  it("offsets a single clip by zero", () => {
    expect(getJoinedTimestampOffsets([5])).toEqual([0]);
  });

  it("offsets each clip by the running total of the clips before it", () => {
    expect(getJoinedTimestampOffsets([5, 3, 7])).toEqual([0, 5, 8]);
  });

  it("treats a zero-duration clip as contributing no offset to the next clip", () => {
    expect(getJoinedTimestampOffsets([5, 0, 3])).toEqual([0, 5, 5]);
  });
});
