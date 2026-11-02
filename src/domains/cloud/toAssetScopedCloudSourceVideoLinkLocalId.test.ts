import { describe, expect, it } from "vitest";

import { toAssetScopedCloudSourceVideoLinkLocalId } from "./toAssetScopedCloudSourceVideoLinkLocalId";

describe("toAssetScopedCloudSourceVideoLinkLocalId", () => {
  it("keeps the asset's own link for an untrimmed source", () => {
    expect(
      toAssetScopedCloudSourceVideoLinkLocalId({
        localAssetId: "asset",
        sourceVideoTrimKey: "full"
      })
    ).toBe("asset");
  });

  it("gives each trim of an asset its own link", () => {
    expect(
      toAssetScopedCloudSourceVideoLinkLocalId({
        localAssetId: "asset",
        sourceVideoTrimKey: "1000-3000"
      })
    ).toBe("asset#trim-1000-3000");
    expect(
      toAssetScopedCloudSourceVideoLinkLocalId({
        localAssetId: "asset",
        sourceVideoTrimKey: "5000-9000"
      })
    ).toBe("asset#trim-5000-9000");
  });
});
