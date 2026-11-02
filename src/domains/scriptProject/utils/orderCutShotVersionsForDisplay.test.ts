import { CutShot, CutShotVersion } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { orderCutShotVersionsForDisplay } from "./orderCutShotVersionsForDisplay";

const cutShotVersion = (
  assetId: string,
  createdAt: string
): CutShotVersion => ({
  layer_id: `layer-${assetId}`,
  asset_id: assetId,
  ready: true,
  status: "completed",
  url: null,
  poster_url: null,
  created_at: createdAt
});

const cutShot = (overrides: Partial<CutShot>): CutShot => ({
  timeline_id: "timeline-1",
  shot_index: 0,
  sequence_id: 1,
  asset_id: null,
  pinned_asset_id: null,
  is_upscale: false,
  url: null,
  poster_url: null,
  versions: [],
  ...overrides
});

describe("orderCutShotVersionsForDisplay", () => {
  it("shows the pinned version and lists the rest newest first below it", () => {
    const ordered = orderCutShotVersionsForDisplay(
      cutShot({
        pinned_asset_id: "middle",
        versions: [
          cutShotVersion("oldest", "2026-10-01T00:00:00Z"),
          cutShotVersion("newest", "2026-10-03T00:00:00Z"),
          cutShotVersion("middle", "2026-10-02T00:00:00Z")
        ]
      }),
      new Map()
    );

    expect(ordered.shownVersion?.asset_id).toBe("middle");
    expect(ordered.pinnedVersionAssetId).toBe("middle");
    expect(
      ordered.versionsBelowShownVersion.map((version) => version.asset_id)
    ).toEqual(["newest", "oldest"]);
    expect(ordered.versionNumberByAssetId.get("newest")).toBe(3);
  });

  it("has nothing to show for a scene with no cut", () => {
    expect(orderCutShotVersionsForDisplay(undefined, new Map())).toMatchObject({
      shownVersion: undefined,
      versionsNewestFirst: [],
      pinnedVersionAssetId: null
    });
  });
});
