import { AssetStatus } from "@schemas/asset";
import { describe, expect, it } from "vitest";

import { isTrackPinnable } from "./isTrackPinnable";

describe("isTrackPinnable", () => {
  it("returns true for a FINISHED render", () => {
    expect(isTrackPinnable(AssetStatus.FINISHED)).toBe(true);
  });

  it.each([
    AssetStatus.ERROR,
    AssetStatus.PENDING,
    AssetStatus.INQUEUE,
    AssetStatus.PAUSED,
    AssetStatus.INPROGRESS,
    AssetStatus.CANCELLED
  ])("returns false for non-finished status %s", (status) => {
    expect(isTrackPinnable(status)).toBe(false);
  });

  it("returns false when status is undefined", () => {
    expect(isTrackPinnable(undefined)).toBe(false);
  });
});
