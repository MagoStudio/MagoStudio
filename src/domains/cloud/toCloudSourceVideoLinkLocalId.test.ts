import { describe, expect, it } from "vitest";

import { toAssetScopedCloudSourceVideoLinkLocalId } from "./toAssetScopedCloudSourceVideoLinkLocalId";
import { toCloudSourceVideoLinkLocalId } from "./toCloudSourceVideoLinkLocalId";

describe("toCloudSourceVideoLinkLocalId", () => {
  it("gives each shot that uses an asset its own link", () => {
    const linkLocalIdForShot = (localShotId: string) =>
      toCloudSourceVideoLinkLocalId({
        localAssetId: "asset",
        localShotId,
        sourceVideoTrimKey: "full"
      });

    expect(linkLocalIdForShot("first-shot")).toBe(
      "asset#shot-first-shot#trim-full"
    );
    expect(linkLocalIdForShot("second-shot")).toBe(
      "asset#shot-second-shot#trim-full"
    );
  });

  it("gives each trim of an asset in one shot its own link", () => {
    expect(
      toCloudSourceVideoLinkLocalId({
        localAssetId: "asset",
        localShotId: "shot",
        sourceVideoTrimKey: "1000-3000"
      })
    ).toBe("asset#shot-shot#trim-1000-3000");
  });

  it("never collides with the asset-scoped link it replaces", () => {
    const sourceVideoLink = {
      localAssetId: "asset",
      localShotId: "shot",
      sourceVideoTrimKey: "full"
    };

    expect(toCloudSourceVideoLinkLocalId(sourceVideoLink)).not.toBe(
      toAssetScopedCloudSourceVideoLinkLocalId(sourceVideoLink)
    );
  });
});
