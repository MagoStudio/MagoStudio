import { describe, expect, it } from "vitest";

import { buildBulkRendersRunImageResultUrlByAssetId } from "./buildBulkRendersRunImageResultUrlByAssetId";

type ResolvedImageAsset = Parameters<
  typeof buildBulkRendersRunImageResultUrlByAssetId
>[0][number];

const buildImageAsset = (overrides: {
  assetId: string;
  urlToUse: string;
}): ResolvedImageAsset => ({
  s3_url: overrides.urlToUse,
  urlToUse: overrides.urlToUse,
  asset: {
    id: overrides.assetId,
    name: "asset",
    data: { duration: 0, thumbnail_filepath: "" },
    rate: 0,
    user_id: "user-1",
    filepath: "",
    type: "image",
    created_at: ""
  }
});

describe("buildBulkRendersRunImageResultUrlByAssetId", () => {
  it("keys each url by the asset's own id, not by array position", () => {
    const secondShotAssetResolvedAlone = [
      buildImageAsset({
        assetId: "asset-second-shot",
        urlToUse: "https://example.com/url-2"
      })
    ];

    const urlByAssetId = buildBulkRendersRunImageResultUrlByAssetId(
      secondShotAssetResolvedAlone
    );

    expect(urlByAssetId.get("asset-first-shot")).toBeUndefined();
    expect(urlByAssetId.get("asset-second-shot")).toBe(
      "https://example.com/url-2"
    );
  });

  it("maps every resolved asset with a secure url by id when several resolve together", () => {
    const resolvedAssets = [
      buildImageAsset({
        assetId: "asset-a",
        urlToUse: "https://example.com/a"
      }),
      buildImageAsset({
        assetId: "asset-b",
        urlToUse: "blob:https://example.com/b"
      })
    ];

    const urlByAssetId =
      buildBulkRendersRunImageResultUrlByAssetId(resolvedAssets);

    expect(urlByAssetId.get("asset-a")).toBe("https://example.com/a");
    expect(urlByAssetId.get("asset-b")).toBe("blob:https://example.com/b");
  });

  it("drops a resolved asset whose url is neither https nor blob", () => {
    const resolvedAssets = [
      buildImageAsset({ assetId: "asset-a", urlToUse: "http://example.com/a" })
    ];

    const urlByAssetId =
      buildBulkRendersRunImageResultUrlByAssetId(resolvedAssets);

    expect(urlByAssetId.has("asset-a")).toBe(false);
  });

  it("returns an empty map when nothing has resolved yet", () => {
    expect(buildBulkRendersRunImageResultUrlByAssetId([]).size).toBe(0);
  });
});
