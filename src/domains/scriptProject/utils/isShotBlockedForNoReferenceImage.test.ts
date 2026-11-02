import { ShotGenerateResultSchema, ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { isShotBlockedForNoReferenceImage } from "./isShotBlockedForNoReferenceImage";

const shot = { timeline_id: "t1" } as ShotState;

const buildDryRun = (blocked: unknown[]) =>
  ShotGenerateResultSchema.parse({ blocked });

describe("isShotBlockedForNoReferenceImage", () => {
  it("is false without a dry run", () => {
    expect(isShotBlockedForNoReferenceImage(undefined, shot)).toBe(false);
  });

  it("is true when the dry run blocks this Shot for having no reference image", () => {
    const dryRun = buildDryRun([
      {
        sequence_id: 1,
        timeline_id: "t1",
        reason_code: "no_reference_image"
      }
    ]);
    expect(isShotBlockedForNoReferenceImage(dryRun, shot)).toBe(true);
  });

  it("is false when another Shot is the one blocked", () => {
    const dryRun = buildDryRun([
      {
        sequence_id: 2,
        timeline_id: "t2",
        reason_code: "no_reference_image"
      }
    ]);
    expect(isShotBlockedForNoReferenceImage(dryRun, shot)).toBe(false);
  });

  it("is false when this Shot is blocked for another reason", () => {
    const dryRun = buildDryRun([
      {
        sequence_id: 1,
        timeline_id: "t1",
        missing: [{ token: "@bob", reason: "no image" }]
      },
      { sequence_id: 1, timeline_id: "t1", reason_code: "no_prompt" }
    ]);
    expect(isShotBlockedForNoReferenceImage(dryRun, shot)).toBe(false);
  });
});
