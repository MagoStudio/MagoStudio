import { describe, expect, it } from "vitest";

import { partitionSkippedAsPinnedUpload } from "./partitionSkippedAsPinnedUpload";

describe("partitionSkippedAsPinnedUpload", () => {
  it("separates a pinned upload from every other reason", () => {
    const { skippedAsPinnedUploadEntries, otherSkippedEntries } =
      partitionSkippedAsPinnedUpload([
        { token: "medic", reason: "user-supplied image pinned" },
        { token: "sergeant", reason: "already rendered with these inputs" }
      ]);

    expect(skippedAsPinnedUploadEntries.map((entry) => entry.token)).toEqual([
      "medic"
    ]);
    expect(otherSkippedEntries.map((entry) => entry.token)).toEqual([
      "sergeant"
    ]);
  });

  it("returns empty lists for an empty skipped list", () => {
    const { skippedAsPinnedUploadEntries, otherSkippedEntries } =
      partitionSkippedAsPinnedUpload<{ reason: string }>([]);

    expect(skippedAsPinnedUploadEntries).toEqual([]);
    expect(otherSkippedEntries).toEqual([]);
  });
});
