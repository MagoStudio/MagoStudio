import { describe, expect, it } from "vitest";

import { findMiniMaxH3EditedFrame } from "./findMiniMaxH3EditedFrame";

describe("findMiniMaxH3EditedFrame", () => {
  it("skips an empty Edited frame slot that comes before the real one", () => {
    expect(
      findMiniMaxH3EditedFrame([
        { asset_id: "", type: "key_frame" },
        { asset_id: "head", type: "reference_frame" },
        { asset_id: "edited", type: "key_frame" }
      ])?.asset_id
    ).toBe("edited");
  });

  it("finds nothing without a filled Edited frame slot", () => {
    expect(
      findMiniMaxH3EditedFrame([
        { asset_id: "", type: "key_frame" },
        { asset_id: "head", type: "reference_frame" }
      ])
    ).toBeUndefined();
  });
});
