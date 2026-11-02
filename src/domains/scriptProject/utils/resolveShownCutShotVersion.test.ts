import { CutShot, CutShotVersion } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { resolveShownCutShotVersion } from "./resolveShownCutShotVersion";

const cutShotVersion = (assetId: string): CutShotVersion => ({
  layer_id: "layer-1",
  asset_id: assetId,
  name: assetId,
  ready: true,
  status: "completed",
  url: `https://assets.mago.studio/${assetId}.mp4`,
  poster_url: `https://assets.mago.studio/${assetId}.jpg`
});

const cutShot = (overrides: Partial<CutShot>): CutShot => ({
  timeline_id: "timeline-1",
  shot_index: 0,
  sequence_id: 1,
  asset_id: null,
  pinned_asset_id: null,
  is_upscale: false,
  url: "https://assets.mago.studio/cut.mp4",
  poster_url: "https://assets.mago.studio/cut.jpg",
  versions: [],
  ...overrides
});

describe("resolveShownCutShotVersion", () => {
  it("shows the pinned version when one is pinned", () => {
    const versionsNewestFirst = [
      cutShotVersion("asset-new"),
      cutShotVersion("asset-pinned")
    ];
    const shot = cutShot({
      pinned_asset_id: "asset-pinned",
      versions: versionsNewestFirst
    });

    expect(
      resolveShownCutShotVersion(shot, versionsNewestFirst)?.asset_id
    ).toBe("asset-pinned");
  });

  it("shows the latest generated version when nothing is pinned", () => {
    const versionsNewestFirst = [
      cutShotVersion("asset-new"),
      cutShotVersion("asset-old")
    ];
    const shot = cutShot({
      asset_id: "asset-old",
      versions: versionsNewestFirst
    });

    expect(
      resolveShownCutShotVersion(shot, versionsNewestFirst)?.asset_id
    ).toBe("asset-new");
  });

  it("shows the latest generated version when the pinned one no longer exists", () => {
    const versionsNewestFirst = [cutShotVersion("asset-new")];
    const shot = cutShot({
      pinned_asset_id: "asset-gone",
      versions: versionsNewestFirst
    });

    expect(
      resolveShownCutShotVersion(shot, versionsNewestFirst)?.asset_id
    ).toBe("asset-new");
  });

  it("shows the newest version in the top slot while it is still rendering", () => {
    const versionsNewestFirst = [
      { ...cutShotVersion("asset-rendering"), ready: false, status: "pending" },
      cutShotVersion("asset-finished")
    ];
    const shot = cutShot({
      pinned_asset_id: "asset-finished",
      versions: versionsNewestFirst
    });

    expect(
      resolveShownCutShotVersion(shot, versionsNewestFirst)?.asset_id
    ).toBe("asset-rendering");
  });

  it("keeps the pinned version in the top slot when the newest version failed", () => {
    const versionsNewestFirst = [
      { ...cutShotVersion("asset-failed"), ready: false, status: "error" },
      cutShotVersion("asset-finished")
    ];
    const shot = cutShot({
      pinned_asset_id: "asset-finished",
      versions: versionsNewestFirst
    });

    expect(
      resolveShownCutShotVersion(shot, versionsNewestFirst)?.asset_id
    ).toBe("asset-finished");
  });

  it("resolves to nothing when the shot has no version", () => {
    expect(resolveShownCutShotVersion(cutShot({}), [])).toBeUndefined();
  });
});
