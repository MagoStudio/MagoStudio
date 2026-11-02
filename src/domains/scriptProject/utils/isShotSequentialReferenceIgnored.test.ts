import { ShotGenerateResult, ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { isShotSequentialReferenceIgnored } from "./isShotSequentialReferenceIgnored";

const shot = { timeline_id: "t1" } as ShotState;

const buildDryRun = (
  sequentialIgnored: ShotGenerateResult["sequential_ignored"]
): ShotGenerateResult =>
  ({
    sequential_ignored: sequentialIgnored,
    blocked: [],
    would_run: [],
    skipped: []
  }) as unknown as ShotGenerateResult;

describe("isShotSequentialReferenceIgnored", () => {
  it("is false when the run reports nothing ignored", () => {
    expect(isShotSequentialReferenceIgnored(buildDryRun([]), shot)).toBe(false);
  });

  it("is false before any dry run has answered", () => {
    expect(isShotSequentialReferenceIgnored(undefined, shot)).toBe(false);
  });

  it("is true for the shot the run names, so it can say it renders without a reference", () => {
    const dryRun = buildDryRun([
      { sequence_id: 1, timeline_id: "t1", reason: "first shot" }
    ]);
    expect(isShotSequentialReferenceIgnored(dryRun, shot)).toBe(true);
  });

  it("does not leak onto a different shot in the same run", () => {
    const dryRun = buildDryRun([
      { sequence_id: 2, timeline_id: "t2", reason: "first shot" }
    ]);
    expect(isShotSequentialReferenceIgnored(dryRun, shot)).toBe(false);
  });
});
