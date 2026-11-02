import { CutShotVersion } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { resolveCutShotVersionAssetIdToShow } from "./resolveCutShotVersionAssetIdToShow";

const cutShotVersion = (
  assetId: string,
  overrides: Partial<CutShotVersion> = {}
): CutShotVersion => ({
  layer_id: "layer-1",
  asset_id: assetId,
  name: assetId,
  ready: true,
  status: "completed",
  url: `https://assets.mago.studio/${assetId}.mp4`,
  poster_url: `https://assets.mago.studio/${assetId}.jpg`,
  ...overrides
});

describe("resolveCutShotVersionAssetIdToShow", () => {
  it("shows the newest version while it is still rendering", () => {
    expect(
      resolveCutShotVersionAssetIdToShow({ pinned_asset_id: "asset-old" }, [
        cutShotVersion("asset-new", { ready: false, status: "pending" }),
        cutShotVersion("asset-old")
      ])
    ).toBe("asset-new");
  });

  it("keeps the saved pin once the newest version has finished", () => {
    expect(
      resolveCutShotVersionAssetIdToShow({ pinned_asset_id: "asset-old" }, [
        cutShotVersion("asset-new"),
        cutShotVersion("asset-old")
      ])
    ).toBe("asset-old");
  });

  it("keeps the saved pin when the newest version failed", () => {
    expect(
      resolveCutShotVersionAssetIdToShow({ pinned_asset_id: "asset-old" }, [
        cutShotVersion("asset-new", { ready: false, status: "error" }),
        cutShotVersion("asset-old")
      ])
    ).toBe("asset-old");
  });
});
