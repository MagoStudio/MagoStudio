import { describe, expect, it } from "vitest";

import { deriveBulkRendersRunShotVideoReferenceFrameTilePresentation } from "./deriveBulkRendersRunShotVideoReferenceFrameTilePresentation";

describe("deriveBulkRendersRunShotVideoReferenceFrameTilePresentation", () => {
  it("shows the image once the reference frame resolved", () => {
    const presentation =
      deriveBulkRendersRunShotVideoReferenceFrameTilePresentation({
        hasReferenceFrameAssetId: true,
        hasResolvedReferenceFrame: true,
        isAssetRequestInFlight: false
      });

    expect(presentation).toBe("image");
  });

  it("shimmers while a known reference frame is being fetched", () => {
    const presentation =
      deriveBulkRendersRunShotVideoReferenceFrameTilePresentation({
        hasReferenceFrameAssetId: true,
        hasResolvedReferenceFrame: false,
        isAssetRequestInFlight: true
      });

    expect(presentation).toBe("shimmer");
  });

  it("is black when a known reference frame's request settled with nothing", () => {
    const presentation =
      deriveBulkRendersRunShotVideoReferenceFrameTilePresentation({
        hasReferenceFrameAssetId: true,
        hasResolvedReferenceFrame: false,
        isAssetRequestInFlight: false
      });

    expect(presentation).toBe("black");
  });

  it("is black while no reference frame exists yet", () => {
    const presentation =
      deriveBulkRendersRunShotVideoReferenceFrameTilePresentation({
        hasReferenceFrameAssetId: false,
        hasResolvedReferenceFrame: false,
        isAssetRequestInFlight: false
      });

    expect(presentation).toBe("black");
  });
});
