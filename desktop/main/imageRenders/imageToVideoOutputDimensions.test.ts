import { describe, expect, it } from "vitest";

import { estimateImageToVideoOutputDimensions } from "./imageToVideoOutputDimensions";

describe("estimateImageToVideoOutputDimensions", () => {
  it("keeps the start image's aspect ratio at the requested short side", () => {
    expect(
      estimateImageToVideoOutputDimensions("720p", {
        width: 1920,
        height: 1080
      })
    ).toEqual({ width: 1280, height: 720 });
    expect(
      estimateImageToVideoOutputDimensions("1080p", {
        width: 1000,
        height: 1500
      })
    ).toEqual({ width: 1080, height: 1620 });
  });

  it("falls back to a square frame when the start image has no dimensions", () => {
    expect(
      estimateImageToVideoOutputDimensions("480p", { width: null, height: 600 })
    ).toEqual({ width: 480, height: 480 });
  });
});
