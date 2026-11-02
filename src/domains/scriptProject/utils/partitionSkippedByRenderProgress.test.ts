import { describe, expect, it } from "vitest";

import { partitionSkippedByRenderProgress } from "./partitionSkippedByRenderProgress";

describe("partitionSkippedByRenderProgress", () => {
  it("separates a live render from a finished one", () => {
    const { skippedAsUnchangedEntries, skippedAsRenderInProgressEntries } =
      partitionSkippedByRenderProgress([
        { sequence_id: 4, reason: "already rendered with these inputs" },
        { sequence_id: 5, reason: "render already in progress" }
      ]);

    expect(skippedAsUnchangedEntries.map((entry) => entry.sequence_id)).toEqual(
      [4]
    );
    expect(
      skippedAsRenderInProgressEntries.map((entry) => entry.sequence_id)
    ).toEqual([5]);
  });

  it("counts an unrecognised reason as unchanged rather than dropping it", () => {
    const { skippedAsUnchangedEntries, skippedAsRenderInProgressEntries } =
      partitionSkippedByRenderProgress([
        { token: "medic", reason: "some reason we have never seen" }
      ]);

    expect(skippedAsUnchangedEntries).toHaveLength(1);
    expect(skippedAsRenderInProgressEntries).toEqual([]);
  });

  it("returns empty lists for an empty skipped list", () => {
    const { skippedAsUnchangedEntries, skippedAsRenderInProgressEntries } =
      partitionSkippedByRenderProgress<{ reason: string }>([]);

    expect(skippedAsUnchangedEntries).toEqual([]);
    expect(skippedAsRenderInProgressEntries).toEqual([]);
  });
});
