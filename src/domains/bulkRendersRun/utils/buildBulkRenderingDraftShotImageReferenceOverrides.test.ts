import { describe, expect, it } from "vitest";

import { buildBulkRenderingDraftShotImageReferenceOverrides } from "./buildBulkRenderingDraftShotImageReferenceOverrides";

describe("buildBulkRenderingDraftShotImageReferenceOverrides", () => {
  it("returns no override when no Shot was touched", () => {
    expect(
      buildBulkRenderingDraftShotImageReferenceOverrides({
        imageReferenceAssetIdsByShotId: {},
        defaultImageReferenceAssetIds: ["asset-1"]
      })
    ).toEqual({});
  });

  it("drops a Shot whose asset ids match the default in the same order", () => {
    expect(
      buildBulkRenderingDraftShotImageReferenceOverrides({
        imageReferenceAssetIdsByShotId: { "shot-1": ["asset-1", "asset-2"] },
        defaultImageReferenceAssetIds: ["asset-1", "asset-2"]
      })
    ).toEqual({});
  });

  it("keeps a Shot whose asset ids differ from the default", () => {
    expect(
      buildBulkRenderingDraftShotImageReferenceOverrides({
        imageReferenceAssetIdsByShotId: {
          "shot-1": ["asset-9"],
          "shot-2": ["asset-1"]
        },
        defaultImageReferenceAssetIds: ["asset-1"]
      })
    ).toEqual({ "shot-1": ["asset-9"] });
  });

  it("keeps a Shot whose asset ids were cleared to empty", () => {
    expect(
      buildBulkRenderingDraftShotImageReferenceOverrides({
        imageReferenceAssetIdsByShotId: { "shot-1": [] },
        defaultImageReferenceAssetIds: ["asset-1"]
      })
    ).toEqual({ "shot-1": [] });
  });

  it("treats a reordered list as an override", () => {
    expect(
      buildBulkRenderingDraftShotImageReferenceOverrides({
        imageReferenceAssetIdsByShotId: { "shot-1": ["asset-2", "asset-1"] },
        defaultImageReferenceAssetIds: ["asset-1", "asset-2"]
      })
    ).toEqual({ "shot-1": ["asset-2", "asset-1"] });
  });

  it("keeps a Shot that added references when the default is empty", () => {
    expect(
      buildBulkRenderingDraftShotImageReferenceOverrides({
        imageReferenceAssetIdsByShotId: { "shot-1": ["asset-1"] },
        defaultImageReferenceAssetIds: []
      })
    ).toEqual({ "shot-1": ["asset-1"] });
  });
});
