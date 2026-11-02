import { describe, expect, it } from "vitest";

import { isAssetCaptionedInCloud } from "./isAssetCaptionedInCloud";

describe("isAssetCaptionedInCloud", () => {
  it("captions a cloud-mirrored asset in the cloud while signed in", () => {
    expect(
      isAssetCaptionedInCloud({
        localAsset: { data: { cloudMirror: true } },
        isCloudAccountActive: true
      })
    ).toBe(true);
  });

  it("captions a cloud-mirrored asset locally when offline", () => {
    expect(
      isAssetCaptionedInCloud({
        localAsset: { data: { cloudMirror: true } },
        isCloudAccountActive: false
      })
    ).toBe(false);
  });

  it("captions a local-only asset locally even while signed in", () => {
    expect(
      isAssetCaptionedInCloud({
        localAsset: { data: {} },
        isCloudAccountActive: true
      })
    ).toBe(false);
  });

  it("asks the cloud for an asset the library does not hold while signed in", () => {
    expect(
      isAssetCaptionedInCloud({ localAsset: null, isCloudAccountActive: true })
    ).toBe(true);
  });

  it("never asks the cloud for an asset the library does not hold when offline", () => {
    expect(
      isAssetCaptionedInCloud({ localAsset: null, isCloudAccountActive: false })
    ).toBe(false);
  });
});
