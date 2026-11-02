import { AssetStatus } from "@schemas/asset";
import { describe, expect, it } from "vitest";

import { ActiveCloudJob, toLocalQueueItems } from "./toLocalQueueItems";

const job = (overrides: Partial<ActiveCloudJob> = {}): ActiveCloudJob => ({
  id: "job-1",
  cloudAssetId: "cloud-asset",
  assetId: "local-asset",
  trackId: "local-track",
  clipId: "local-clip",
  projectId: "local-project",
  shotId: "local-shot",
  model: "seedance_2",
  status: "INPROGRESS",
  ...overrides
});

/** Shaped like the staging queue, including the fields the UI reads. */
const cloudItem = (overrides: Record<string, unknown> = {}) => ({
  id: "queue-1",
  status: "INPROGRESS",
  asset_id: "cloud-asset",
  created_at: "2026-08-28T08:00:00+00:00",
  render_started_at: "2026-08-28T08:00:05",
  finished_at: null,
  progress: 42,
  display_order: 3,
  ETA: 90,
  queue_id: "integrations_queue",
  frame_range: [4, 52],
  project_name: "Cloud mirror",
  timeline_name: "Shot 2",
  layer_name: "Seedance render",
  price: 12,
  ...overrides
});

describe("toLocalQueueItems", () => {
  it("swaps cloud ids for the local ones the UI matches on", () => {
    // findMatchingQueueItem matches a track by its clip's local asset id.
    const [item] = toLocalQueueItems([cloudItem()], [job()]);

    expect(item?.asset_id).toBe("local-asset");
    expect(item?.layer_id).toBe("local-track");
    expect(item?.timeline_id).toBe("local-shot");
  });

  it("keeps the full queue presentation shape and identifies the provider", () => {
    const [item] = toLocalQueueItems([cloudItem()], [job()]);

    expect(item).toEqual(
      expect.objectContaining({
        queue_id: "integrations_queue",
        project_name: "Cloud mirror",
        timeline_name: "Shot 2",
        layer_name: "Seedance render",
        frame_range: [4, 52],
        price: 12,
        render_model: "seedance_2",
        render_provider: "mago-cloud"
      })
    );
  });

  it("uses safe presentation defaults when optional backend fields are absent", () => {
    const [item] = toLocalQueueItems(
      [
        {
          id: "queue-1",
          status: "INPROGRESS",
          asset_id: "cloud-asset"
        }
      ],
      [job()]
    );

    expect(item?.frame_range).toEqual([0, 0]);
    expect(item?.project_name).toBe("Mago cloud project");
    expect(item?.timeline_name).toBe("Shot");
    expect(item?.layer_name).toBe("seedance_2");
  });

  it("carries the progress, position and ETA the UI already displays", () => {
    const [item] = toLocalQueueItems([cloudItem()], [job()]);

    expect(item?.progress).toBe(42);
    expect(item?.display_order).toBe(3);
    expect(item?.ETA).toBe(90);
  });

  it("maps queue statuses onto the app's own", () => {
    const cases: [string, AssetStatus][] = [
      ["INQUEUE", AssetStatus.INQUEUE],
      ["INPROGRESS", AssetStatus.INPROGRESS],
      ["FINISHED", AssetStatus.FINISHED],
      ["ERROR", AssetStatus.ERROR],
      ["CANCELLED", AssetStatus.CANCELLED]
    ];
    for (const [queueStatus, expected] of cases) {
      const [item] = toLocalQueueItems(
        [cloudItem({ status: queueStatus })],
        [job()]
      );
      expect(item?.status).toBe(expected);
    }
  });

  it("shows an unfamiliar status as pending rather than finished", () => {
    const [item] = toLocalQueueItems(
      [cloudItem({ status: "SOMETHING_NEW", render_started_at: null })],
      [job()]
    );

    expect(item?.status).toBe(AssetStatus.INQUEUE);
  });

  it("passes a failure reason through for the error display", () => {
    const [item] = toLocalQueueItems(
      [cloudItem({ status: "ERROR", rejected_reason: "Out of credits" })],
      [job()]
    );

    expect(item?.error).toEqual({ error_message: "Out of credits" });
  });

  it("omits the error field when the server recorded no reason", () => {
    const [item] = toLocalQueueItems(
      [cloudItem({ status: "ERROR", error: {} })],
      [job()]
    );

    expect(item?.error).toBeUndefined();
  });

  it("ignores queue items belonging to renders this app does not track", () => {
    // The cloud queue is the whole account's, including the web app's renders.
    expect(
      toLocalQueueItems([cloudItem({ asset_id: "someone-elses" })], [job()])
    ).toEqual([]);
  });

  it("returns nothing when there are no jobs to match", () => {
    expect(toLocalQueueItems([cloudItem()], [])).toEqual([]);
    expect(
      toLocalQueueItems([cloudItem()], [job({ cloudAssetId: null })])
    ).toEqual([]);
  });

  it("survives a queue response that is not a list", () => {
    for (const response of [null, undefined, {}, "nonsense"]) {
      expect(toLocalQueueItems(response, [job()])).toEqual([]);
    }
  });

  it("handles several tracked renders at once", () => {
    const items = toLocalQueueItems(
      [
        cloudItem(),
        cloudItem({ id: "queue-2", asset_id: "cloud-b", progress: 10 })
      ],
      [
        job(),
        job({
          id: "job-2",
          cloudAssetId: "cloud-b",
          assetId: "local-b",
          trackId: "track-b"
        })
      ]
    );

    expect(items.map((item) => item.asset_id)).toEqual([
      "local-asset",
      "local-b"
    ]);
  });
});
