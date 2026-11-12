import { ProjectCutSchema } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { isCutStillBeingProduced } from "./isCutStillBeingProduced";

const cutWithVersion = (version: Record<string, unknown>) =>
  ProjectCutSchema.parse({
    project_id: "project",
    shots: [
      {
        timeline_id: "scene",
        shot_index: 0,
        sequence_id: 1,
        versions: [{ layer_id: "layer", asset_id: "take", ...version }]
      }
    ]
  });

describe("isCutStillBeingProduced", () => {
  it("is true while a version renders", () => {
    expect(
      isCutStillBeingProduced(
        cutWithVersion({ ready: false, status: "inprogress" })
      )
    ).toBe(true);
  });

  it("is true while a landed version awaits its dub", () => {
    expect(
      isCutStillBeingProduced(
        cutWithVersion({ ready: true, awaiting_dub: true })
      )
    ).toBe(true);
  });

  it("is false once every version is finished and dubbed", () => {
    expect(isCutStillBeingProduced(cutWithVersion({ ready: true }))).toBe(
      false
    );
  });

  it("is false for a failed render that still carries a stale flag", () => {
    expect(
      isCutStillBeingProduced(
        cutWithVersion({ ready: false, status: "error", awaiting_dub: true })
      )
    ).toBe(false);
  });
});
