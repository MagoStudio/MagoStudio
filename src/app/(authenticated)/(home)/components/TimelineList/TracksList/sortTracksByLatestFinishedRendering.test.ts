import { createLayer } from "@tests/factories/layer";
import { createQueueItem } from "@tests/factories/queueItem";
import { describe, expect, it } from "vitest";

import { sortTracksByLatestFinishedRendering } from "./sortTracksByLatestFinishedRendering";

const makeQueueItem = (assetId: string, finishedAt: string) =>
  createQueueItem({ asset_id: assetId, finished_at: finishedAt });

describe("sortTracksByLatestFinishedRendering", () => {
  it("does not crash when a track has no clips (clips[0] is undefined)", () => {
    const trackWithNoClips = createLayer({ clips: [] });
    const trackNormal = createLayer();

    expect(() =>
      sortTracksByLatestFinishedRendering([trackWithNoClips, trackNormal], [])
    ).not.toThrow();
  });

  it("returns tracks sorted by most recent finished_at first", () => {
    const olderAssetId = "asset-old";
    const newerAssetId = "asset-new";

    const olderTrack = createLayer({
      clips: [{ ...createLayer().clips[0], asset_id: olderAssetId }]
    });
    const newerTrack = createLayer({
      clips: [{ ...createLayer().clips[0], asset_id: newerAssetId }]
    });

    const queue = [
      makeQueueItem(olderAssetId, "2025-01-01T00:00:00Z"),
      makeQueueItem(newerAssetId, "2025-06-01T00:00:00Z")
    ];

    const result = sortTracksByLatestFinishedRendering(
      [olderTrack, newerTrack],
      queue
    );

    expect(result[0].clips[0].asset_id).toBe(newerAssetId);
    expect(result[1].clips[0].asset_id).toBe(olderAssetId);
  });

  it("does not crash when queue is undefined", () => {
    const track = createLayer();
    expect(() =>
      sortTracksByLatestFinishedRendering([track], undefined)
    ).not.toThrow();
  });
});
