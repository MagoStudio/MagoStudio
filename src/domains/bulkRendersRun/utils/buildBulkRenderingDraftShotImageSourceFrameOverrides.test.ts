import { describe, expect, it } from "vitest";

import { buildBulkRenderingDraftShotImageSourceFrameOverrides } from "./buildBulkRenderingDraftShotImageSourceFrameOverrides";

describe("buildBulkRenderingDraftShotImageSourceFrameOverrides", () => {
  it("returns no override when no Shot was touched", () => {
    expect(
      buildBulkRenderingDraftShotImageSourceFrameOverrides({
        imageSourceFrameByShotId: {},
        defaultImageSourceFrame: 0
      })
    ).toEqual({});
  });

  it("drops a Shot whose frame was set back to the default", () => {
    expect(
      buildBulkRenderingDraftShotImageSourceFrameOverrides({
        imageSourceFrameByShotId: { "shot-1": 0 },
        defaultImageSourceFrame: 0
      })
    ).toEqual({});
  });

  it("keeps only the Shots whose frame differs from the default", () => {
    expect(
      buildBulkRenderingDraftShotImageSourceFrameOverrides({
        imageSourceFrameByShotId: { "shot-1": 120, "shot-2": 0 },
        defaultImageSourceFrame: 0
      })
    ).toEqual({ "shot-1": 120 });
  });
});
