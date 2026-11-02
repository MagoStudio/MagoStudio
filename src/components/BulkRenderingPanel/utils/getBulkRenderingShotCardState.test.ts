import { describe, expect, it } from "vitest";

import { getBulkRenderingShotCardState } from "./getBulkRenderingShotCardState";

describe("getBulkRenderingShotCardState", () => {
  it("returns loading while the Shot is still rendering", () => {
    expect(
      getBulkRenderingShotCardState({
        status: "rendering",
        isResultPreviewLoading: false
      })
    ).toBe("loading");
  });

  it("returns failedQualityTest when the Shot failed its quality test", () => {
    expect(
      getBulkRenderingShotCardState({
        status: "failedQualityTest",
        isResultPreviewLoading: false
      })
    ).toBe("failedQualityTest");
  });

  it("returns unknownError for any other error status", () => {
    expect(
      getBulkRenderingShotCardState({
        status: "unknownError",
        isResultPreviewLoading: false
      })
    ).toBe("unknownError");
  });

  it("returns assetUnavailable when completed and the preview has settled without a URL", () => {
    expect(
      getBulkRenderingShotCardState({
        status: "completed",
        isResultPreviewLoading: false
      })
    ).toBe("assetUnavailable");
  });

  it("returns loaded when completed with an asset URL", () => {
    expect(
      getBulkRenderingShotCardState({
        status: "completed",
        assetUrl: "https://example.com/shot.png",
        isResultPreviewLoading: false
      })
    ).toBe("loaded");
  });

  it("returns loading, not assetUnavailable, while the preview is still resolving", () => {
    expect(
      getBulkRenderingShotCardState({
        status: "completed",
        isResultPreviewLoading: true
      })
    ).toBe("loading");
  });

  it("prefers a resolved URL over the loading flag, so a late flag never blanks a result", () => {
    expect(
      getBulkRenderingShotCardState({
        status: "completed",
        assetUrl: "https://example.com/shot.png",
        isResultPreviewLoading: true
      })
    ).toBe("loaded");
  });
});
