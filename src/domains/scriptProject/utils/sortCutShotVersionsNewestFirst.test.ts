import { CutShotVersion } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { sortCutShotVersionsNewestFirst } from "./sortCutShotVersionsNewestFirst";

const cutShotVersion = (
  assetId: string,
  overrides: Partial<CutShotVersion> = {}
): CutShotVersion => ({
  layer_id: `layer-${assetId}`,
  asset_id: assetId,
  ready: true,
  status: "completed",
  url: null,
  poster_url: null,
  ...overrides
});

const sortedAssetIds = (
  versions: CutShotVersion[],
  layerCreatedAtMsByLayerId: ReadonlyMap<string, number> = new Map()
) =>
  sortCutShotVersionsNewestFirst(versions, layerCreatedAtMsByLayerId).map(
    (version) => version.asset_id
  );

describe("sortCutShotVersionsNewestFirst", () => {
  it("orders versions by their own creation time, newest first", () => {
    expect(
      sortedAssetIds([
        cutShotVersion("old", { created_at: "2026-10-13T10:00:00Z" }),
        cutShotVersion("new", { created_at: "2026-10-15T10:00:00Z" }),
        cutShotVersion("middle", { created_at: "2026-10-14T10:00:00Z" })
      ])
    ).toEqual(["new", "middle", "old"]);
  });

  it("falls back to the layer creation time when the version has none", () => {
    const layerCreatedAtMsByLayerId = new Map([
      ["layer-old", Date.parse("2026-10-13T10:00:00Z")],
      ["layer-new", Date.parse("2026-10-15T10:00:00Z")]
    ]);
    expect(
      sortedAssetIds(
        [cutShotVersion("old"), cutShotVersion("new")],
        layerCreatedAtMsByLayerId
      )
    ).toEqual(["new", "old"]);
  });

  it("puts a just-rendered version with no known creation time first, latest listed first", () => {
    expect(
      sortedAssetIds([
        cutShotVersion("first-listed"),
        cutShotVersion("dated", { created_at: "2026-10-13T10:00:00Z" }),
        cutShotVersion("last-listed")
      ])
    ).toEqual(["last-listed", "first-listed", "dated"]);
  });

  it("leaves the given list untouched", () => {
    const versions = [
      cutShotVersion("old", { created_at: "2026-10-13T10:00:00Z" }),
      cutShotVersion("new", { created_at: "2026-10-15T10:00:00Z" })
    ];
    sortCutShotVersionsNewestFirst(versions, new Map());
    expect(versions.map((version) => version.asset_id)).toEqual(["old", "new"]);
  });
});
