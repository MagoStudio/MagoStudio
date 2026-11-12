import { ProjectCutSchema } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { isCutShotVersionHiddenUntilDubLands } from "./isCutShotVersionHiddenUntilDubLands";

const shot = ProjectCutSchema.parse({
  project_id: "project",
  shots: [
    {
      timeline_id: "scene",
      shot_index: 0,
      sequence_id: 1,
      asset_id: "dubbed",
      versions: [
        { layer_id: "l1", asset_id: "dubbed", ready: true },
        {
          layer_id: "l2",
          asset_id: "awaiting",
          ready: true,
          awaiting_dub: true
        },
        {
          layer_id: "l3",
          asset_id: "failed",
          ready: false,
          status: "error",
          awaiting_dub: true
        }
      ]
    }
  ]
}).shots[0]!;

describe("isCutShotVersionHiddenUntilDubLands", () => {
  it("is a landed render whose dub has not settled, pinned or not", () => {
    expect(
      isCutShotVersionHiddenUntilDubLands(shot, { asset_id: "awaiting" })
    ).toBe(true);
  });

  it("is never a dubbed take", () => {
    expect(
      isCutShotVersionHiddenUntilDubLands(shot, { asset_id: "dubbed" })
    ).toBe(false);
  });

  it("is never a failed render that still carries a stale flag", () => {
    expect(
      isCutShotVersionHiddenUntilDubLands(shot, { asset_id: "failed" })
    ).toBe(false);
  });

  it("is never a version the scene does not have", () => {
    expect(
      isCutShotVersionHiddenUntilDubLands(shot, { asset_id: "unknown" })
    ).toBe(false);
  });
});
