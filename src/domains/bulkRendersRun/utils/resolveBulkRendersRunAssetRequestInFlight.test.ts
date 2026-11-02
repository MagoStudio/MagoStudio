import { describe, expect, it } from "vitest";

import { resolveBulkRendersRunAssetRequestInFlight } from "./resolveBulkRendersRunAssetRequestInFlight";

describe("resolveBulkRendersRunAssetRequestInFlight", () => {
  it("is false when there is no asset id to request", () => {
    expect(
      resolveBulkRendersRunAssetRequestInFlight({
        assetId: undefined,
        resolvedUrl: undefined,
        requestedAssetIds: new Set(["some-other-asset"]),
        isAssetBatchLoading: true
      })
    ).toBe(false);
  });

  it("is false once the asset has resolved, even while the batch is loading", () => {
    expect(
      resolveBulkRendersRunAssetRequestInFlight({
        assetId: "asset-1",
        resolvedUrl: "https://example.com/asset-1.jpg",
        requestedAssetIds: new Set(["asset-1"]),
        isAssetBatchLoading: true
      })
    ).toBe(false);
  });

  it("is true when the asset id is part of the requested batch and the batch is loading", () => {
    expect(
      resolveBulkRendersRunAssetRequestInFlight({
        assetId: "asset-1",
        resolvedUrl: undefined,
        requestedAssetIds: new Set(["asset-1", "asset-2"]),
        isAssetBatchLoading: true
      })
    ).toBe(true);
  });

  it("is false when a batch fetch is in flight but for a DIFFERENT Shot's asset id", () => {
    expect(
      resolveBulkRendersRunAssetRequestInFlight({
        assetId: "asset-not-in-this-batch",
        resolvedUrl: undefined,
        requestedAssetIds: new Set(["some-other-shots-asset"]),
        isAssetBatchLoading: true
      })
    ).toBe(false);
  });

  it("is false once the batch settles with nothing for this asset id", () => {
    expect(
      resolveBulkRendersRunAssetRequestInFlight({
        assetId: "asset-1",
        resolvedUrl: undefined,
        requestedAssetIds: new Set(["asset-1"]),
        isAssetBatchLoading: false
      })
    ).toBe(false);
  });
});
