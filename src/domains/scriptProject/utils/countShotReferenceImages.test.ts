import { ShotState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { countShotReferenceImages } from "./countShotReferenceImages";

const shotWithReferences = (references: ShotState["references"]): ShotState =>
  ({ references }) as unknown as ShotState;

describe("countShotReferenceImages", () => {
  it("counts nothing for a Shot with no references and no continuation", () => {
    expect(
      countShotReferenceImages(shotWithReferences({}), {
        isContinuationSent: false
      })
    ).toBe(0);
  });

  it("sums every reference across every tagged category", () => {
    const shot = shotWithReferences({
      characters: [
        { token: "@a", asset_id: "a1" },
        { token: "@b", asset_id: "a2" }
      ],
      environments: [{ token: "@c", asset_id: "a3" }]
    });

    expect(countShotReferenceImages(shot, { isContinuationSent: false })).toBe(
      3
    );
  });

  it("adds one image when the Shot sends a continuation reference", () => {
    const shot = shotWithReferences({
      characters: [{ token: "@a", asset_id: "a1" }]
    });

    expect(countShotReferenceImages(shot, { isContinuationSent: true })).toBe(
      2
    );
  });

  it("counts only the continuation when there are no tagged references", () => {
    expect(
      countShotReferenceImages(shotWithReferences({}), {
        isContinuationSent: true
      })
    ).toBe(1);
  });
});
