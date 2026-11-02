import { describe, expect, it } from "vitest";

import { deriveBulkRendersRunShotImageTilePresentation } from "./deriveBulkRendersRunShotImageTilePresentation";

describe("deriveBulkRendersRunShotImageTilePresentation", () => {
  it("is black while queued, with no request in flight", () => {
    expect(
      deriveBulkRendersRunShotImageTilePresentation({
        cardState: "pending",
        hasResolvedImage: false,
        isAssetRequestInFlight: false
      })
    ).toBe("black");
  });

  it("shows the rendering placeholder while rendering", () => {
    expect(
      deriveBulkRendersRunShotImageTilePresentation({
        cardState: "rendering",
        hasResolvedImage: false,
        isAssetRequestInFlight: false
      })
    ).toBe("rendering");
  });

  it("shimmers while the result image is being fetched", () => {
    expect(
      deriveBulkRendersRunShotImageTilePresentation({
        cardState: "ready",
        hasResolvedImage: false,
        isAssetRequestInFlight: true
      })
    ).toBe("shimmer");
  });

  it("is black when the result image request has settled with nothing", () => {
    expect(
      deriveBulkRendersRunShotImageTilePresentation({
        cardState: "ready",
        hasResolvedImage: false,
        isAssetRequestInFlight: false
      })
    ).toBe("black");
  });

  it("shows the image once ready and the result has resolved", () => {
    expect(
      deriveBulkRendersRunShotImageTilePresentation({
        cardState: "ready",
        hasResolvedImage: true,
        isAssetRequestInFlight: false
      })
    ).toBe("image");
  });

  it("shows the quality-failure presentation for a quality failure", () => {
    expect(
      deriveBulkRendersRunShotImageTilePresentation({
        cardState: "qualityFailure",
        hasResolvedImage: false,
        isAssetRequestInFlight: false
      })
    ).toBe("qualityFailure");
  });

  it("shows the infrastructure-failure presentation for an infrastructure failure", () => {
    expect(
      deriveBulkRendersRunShotImageTilePresentation({
        cardState: "infrastructureFailure",
        hasResolvedImage: false,
        isAssetRequestInFlight: false
      })
    ).toBe("infrastructureFailure");
  });
});
