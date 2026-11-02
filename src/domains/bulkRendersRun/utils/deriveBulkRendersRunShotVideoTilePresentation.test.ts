import { describe, expect, it } from "vitest";

import { deriveBulkRendersRunShotVideoTilePresentation } from "./deriveBulkRendersRunShotVideoTilePresentation";

describe("deriveBulkRendersRunShotVideoTilePresentation", () => {
  it("is black while the Video step has not started and nothing is in flight", () => {
    expect(
      deriveBulkRendersRunShotVideoTilePresentation({
        cardState: "pending",
        hasResolvedVideo: false,
        isAssetRequestInFlight: false
      })
    ).toBe("black");
  });

  it("shows the rendering placeholder while the Video step runs", () => {
    expect(
      deriveBulkRendersRunShotVideoTilePresentation({
        cardState: "rendering",
        hasResolvedVideo: false,
        isAssetRequestInFlight: false
      })
    ).toBe("rendering");
  });

  it("shows the video once the Video step is done and the asset resolved", () => {
    expect(
      deriveBulkRendersRunShotVideoTilePresentation({
        cardState: "ready",
        hasResolvedVideo: true,
        isAssetRequestInFlight: false
      })
    ).toBe("video");
  });

  it("shimmers while the Video step is done and the result frame is being fetched", () => {
    expect(
      deriveBulkRendersRunShotVideoTilePresentation({
        cardState: "ready",
        hasResolvedVideo: false,
        isAssetRequestInFlight: true
      })
    ).toBe("shimmer");
  });

  it("is black when the Video step is done and the result frame request settled with nothing", () => {
    expect(
      deriveBulkRendersRunShotVideoTilePresentation({
        cardState: "ready",
        hasResolvedVideo: false,
        isAssetRequestInFlight: false
      })
    ).toBe("black");
  });

  it("shows the quality failure regardless of a resolved video", () => {
    expect(
      deriveBulkRendersRunShotVideoTilePresentation({
        cardState: "qualityFailure",
        hasResolvedVideo: true,
        isAssetRequestInFlight: false
      })
    ).toBe("qualityFailure");
  });

  it("shows the infrastructure failure regardless of a resolved video", () => {
    expect(
      deriveBulkRendersRunShotVideoTilePresentation({
        cardState: "infrastructureFailure",
        hasResolvedVideo: true,
        isAssetRequestInFlight: false
      })
    ).toBe("infrastructureFailure");
  });
});
