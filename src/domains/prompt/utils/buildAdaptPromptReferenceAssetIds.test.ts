import { describe, expect, it } from "vitest";

import { buildAdaptPromptReferenceAssetIds } from "./buildAdaptPromptReferenceAssetIds";

describe("buildAdaptPromptReferenceAssetIds", () => {
  it("is empty when the video reference is off and no reference image is set", () => {
    expect(
      buildAdaptPromptReferenceAssetIds({
        sourceVideoAssetId: undefined,
        referenceImageAssetIds: []
      })
    ).toEqual([]);
  });

  it("sends the source video alone when no reference image is set", () => {
    expect(
      buildAdaptPromptReferenceAssetIds({
        sourceVideoAssetId: "video-asset",
        referenceImageAssetIds: []
      })
    ).toEqual(["video-asset"]);
  });

  it("puts the source video first and keeps the reference images in their own order", () => {
    expect(
      buildAdaptPromptReferenceAssetIds({
        sourceVideoAssetId: "video-asset",
        referenceImageAssetIds: ["image-1", "image-2"]
      })
    ).toEqual(["video-asset", "image-1", "image-2"]);
  });

  it("keeps the reference images in their own order when the video reference is off", () => {
    expect(
      buildAdaptPromptReferenceAssetIds({
        sourceVideoAssetId: undefined,
        referenceImageAssetIds: ["image-1", "image-2"]
      })
    ).toEqual(["image-1", "image-2"]);
  });
});
