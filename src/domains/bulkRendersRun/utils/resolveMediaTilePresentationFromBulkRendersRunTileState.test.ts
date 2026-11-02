import { describe, expect, it } from "vitest";

import { resolveMediaTilePresentationFromBulkRendersRunTileState } from "./resolveMediaTilePresentationFromBulkRendersRunTileState";

describe("resolveMediaTilePresentationFromBulkRendersRunTileState", () => {
  it("passes black through unchanged", () => {
    expect(
      resolveMediaTilePresentationFromBulkRendersRunTileState("black")
    ).toBe("black");
  });

  it("passes shimmer through unchanged", () => {
    expect(
      resolveMediaTilePresentationFromBulkRendersRunTileState("shimmer")
    ).toBe("shimmer");
  });

  it("passes rendering through unchanged", () => {
    expect(
      resolveMediaTilePresentationFromBulkRendersRunTileState("rendering")
    ).toBe("rendering");
  });

  it("maps the Image tab's resolved state to asset", () => {
    expect(
      resolveMediaTilePresentationFromBulkRendersRunTileState("image")
    ).toBe("asset");
  });

  it("maps the Video tab's resolved state to asset", () => {
    expect(
      resolveMediaTilePresentationFromBulkRendersRunTileState("video")
    ).toBe("asset");
  });

  it("maps a quality failure to asset, so the failure overlay can render", () => {
    expect(
      resolveMediaTilePresentationFromBulkRendersRunTileState("qualityFailure")
    ).toBe("asset");
  });

  it("maps an infrastructure failure to asset, so the failure overlay can render", () => {
    expect(
      resolveMediaTilePresentationFromBulkRendersRunTileState(
        "infrastructureFailure"
      )
    ).toBe("asset");
  });
});
