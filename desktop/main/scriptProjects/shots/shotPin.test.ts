import { describe, expect, it } from "vitest";

import { resolveCutShot, shotPin, shotPinError } from "./shotPin";

const version = (assetId: string, ready = true) => ({
  asset_id: assetId,
  name: `Take ${assetId}`,
  ready,
  url: `${assetId}.mp4`,
  poster_url: `${assetId}.png`,
  upscale_of: null
});

describe("shotPin", () => {
  it("uses the pin while it names a version, else the newest finished render", () => {
    const versions = [version("a"), version("b"), version("c", false)];
    expect(shotPin({ pinned_asset_id: "a", versions })).toBe("a");
    expect(shotPin({ pinned_asset_id: null, versions })).toBe("b");
    expect(shotPin({ pinned_asset_id: "gone", versions })).toBe("b");
    // A cut written before pins were stored apart.
    expect(shotPin({ asset_id: "a", versions })).toBe("a");
    expect(shotPin({ pinned_asset_id: null, versions: [] })).toBeNull();
  });
});

describe("resolveCutShot", () => {
  it("keeps playing the newest render when the pin is cleared", () => {
    const cutShot = resolveCutShot({
      pinned_asset_id: null,
      asset_id: "a",
      versions: [version("a"), version("b")]
    });
    expect(cutShot).toEqual(
      expect.objectContaining({
        asset_id: "b",
        version_name: "Take b",
        url: "b.mp4",
        poster_url: "b.png",
        is_upscale: false
      })
    );
  });
});

describe("shotPinError", () => {
  it("refuses a version the shot does not have or that has not finished", () => {
    const cutShot = { versions: [version("a"), version("b", false)] };
    expect(shotPinError(cutShot, "a")).toBeNull();
    expect(shotPinError(cutShot, null)).toBeNull();
    expect(shotPinError(cutShot, "x")).toBe(
      "asset_id is not one of this shot's versions"
    );
    expect(shotPinError(cutShot, "b")).toBe(
      "asset_id belongs to a render that has not completed"
    );
  });
});
