import { describe, expect, it } from "vitest";

import { isCloudMirroredAssetCachedLocally } from "./isCloudMirroredAssetCachedLocally";

describe("isCloudMirroredAssetCachedLocally", () => {
  it("is true once the mirror has downloaded the cloud asset's file", () => {
    expect(
      isCloudMirroredAssetCachedLocally({
        data: { cloudMirror: true, status: "ingested" }
      })
    ).toBe(true);
  });

  it("is false while the mirrored file is still downloading", () => {
    expect(
      isCloudMirroredAssetCachedLocally({
        data: { cloudMirror: true, status: "created" }
      })
    ).toBe(false);
  });

  it("is false for a local-only asset and for a missing asset", () => {
    expect(
      isCloudMirroredAssetCachedLocally({ data: { status: "ingested" } })
    ).toBe(false);
    expect(isCloudMirroredAssetCachedLocally(null)).toBe(false);
  });
});
