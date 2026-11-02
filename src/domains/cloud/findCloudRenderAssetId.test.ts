import { describe, expect, it } from "vitest";

import { findCloudRenderAssetId } from "./findCloudRenderAssetId";

describe("findCloudRenderAssetId", () => {
  it("returns the asset of the newest clip on the render layer", () => {
    expect(
      findCloudRenderAssetId({
        clips: [{ asset: { id: "older" } }, { asset: { id: "newest" } }]
      })
    ).toBe("newest");
  });

  it("skips clips whose asset has no id", () => {
    expect(
      findCloudRenderAssetId({
        clips: [{ asset: { id: "render" } }, { asset: {} }]
      })
    ).toBe("render");
  });

  it("returns null when the layer holds no clip with an asset", () => {
    expect(findCloudRenderAssetId({ clips: [] })).toBeNull();
    expect(findCloudRenderAssetId({})).toBeNull();
    expect(findCloudRenderAssetId(null)).toBeNull();
  });
});
