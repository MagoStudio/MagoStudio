import { describe, expect, it } from "vitest";

import { extractShotImageAssetIdsFromShotOverrides } from "./extractShotImageAssetIdsFromShotOverrides";

describe("extractShotImageAssetIdsFromShotOverrides", () => {
  it("extracts the asset_id from each shot's images override", () => {
    const result = extractShotImageAssetIdsFromShotOverrides({
      "shot-1": {
        images: [{ asset_id: "asset-1", type: "reference_frame" }]
      },
      "shot-2": {
        images: [{ asset_id: "asset-2", type: "reference_frame" }]
      }
    });

    expect(result).toEqual({ "shot-1": "asset-1", "shot-2": "asset-2" });
  });

  it("skips shots with no images override", () => {
    const result = extractShotImageAssetIdsFromShotOverrides({
      "shot-1": {}
    });

    expect(result).toEqual({});
  });

  it("returns an empty object when shot_overrides is undefined", () => {
    expect(extractShotImageAssetIdsFromShotOverrides(undefined)).toEqual({});
  });
});
