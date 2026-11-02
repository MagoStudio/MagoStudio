import { type QueueItem } from "@hooks/queue/interface";
import { AssetStatus } from "@schemas/asset";
import { describe, expect, it } from "vitest";

import {
  findRendersThatJustEnded,
  toRenderSnapshots
} from "./findRendersThatJustEnded";

const queueItem = (id: string, status: AssetStatus): QueueItem =>
  ({ id, asset_id: `asset-${id}`, status }) as QueueItem;

const snapshotsOf = (...items: QueueItem[]) => toRenderSnapshots(items);

const endedAssetIds = (args: Parameters<typeof findRendersThatJustEnded>[0]) =>
  findRendersThatJustEnded(args).map((render) => render.assetId);

describe("toRenderSnapshots", () => {
  it("marks finished and errored renders as ended", () => {
    const snapshots = snapshotsOf(
      queueItem("a", AssetStatus.FINISHED),
      queueItem("b", AssetStatus.ERROR),
      queueItem("c", AssetStatus.INPROGRESS)
    );

    expect(snapshots.get("a")?.hasEnded).toBe(true);
    expect(snapshots.get("b")?.hasEnded).toBe(true);
    expect(snapshots.get("c")?.hasEnded).toBe(false);
  });

  it("keeps the asset id each render belongs to", () => {
    const snapshots = snapshotsOf(queueItem("a", AssetStatus.FINISHED));

    expect(snapshots.get("a")?.assetId).toBe("asset-a");
  });

  it("does not treat a cancelled render as ended", () => {
    const snapshots = snapshotsOf(queueItem("a", AssetStatus.CANCELLED));

    expect(snapshots.get("a")?.hasEnded).toBe(false);
  });
});

describe("findRendersThatJustEnded", () => {
  it("finds a render that went from in-progress to finished", () => {
    expect(
      endedAssetIds({
        previousRenders: snapshotsOf(queueItem("a", AssetStatus.INPROGRESS)),
        currentRenders: snapshotsOf(queueItem("a", AssetStatus.FINISHED))
      })
    ).toEqual(["asset-a"]);
  });

  it("finds a render that went from pending to error", () => {
    expect(
      endedAssetIds({
        previousRenders: snapshotsOf(queueItem("a", AssetStatus.PENDING)),
        currentRenders: snapshotsOf(queueItem("a", AssetStatus.ERROR))
      })
    ).toEqual(["asset-a"]);
  });

  it("ignores a render that was already ended", () => {
    expect(
      endedAssetIds({
        previousRenders: snapshotsOf(queueItem("a", AssetStatus.FINISHED)),
        currentRenders: snapshotsOf(queueItem("a", AssetStatus.FINISHED))
      })
    ).toEqual([]);
  });

  it("ignores a render that is still running", () => {
    expect(
      endedAssetIds({
        previousRenders: snapshotsOf(queueItem("a", AssetStatus.INQUEUE)),
        currentRenders: snapshotsOf(queueItem("a", AssetStatus.INPROGRESS))
      })
    ).toEqual([]);
  });

  it("finds a render first seen already ended", () => {
    expect(
      endedAssetIds({
        previousRenders: snapshotsOf(queueItem("a", AssetStatus.INPROGRESS)),
        currentRenders: snapshotsOf(
          queueItem("a", AssetStatus.INPROGRESS),
          queueItem("b", AssetStatus.FINISHED)
        )
      })
    ).toEqual(["asset-b"]);
  });

  it("finds a render that left the queue before it ended", () => {
    expect(
      endedAssetIds({
        previousRenders: snapshotsOf(queueItem("a", AssetStatus.INPROGRESS)),
        currentRenders: new Map()
      })
    ).toEqual(["asset-a"]);
  });

  it("ignores an already-ended render that left the queue", () => {
    expect(
      endedAssetIds({
        previousRenders: snapshotsOf(queueItem("a", AssetStatus.FINISHED)),
        currentRenders: new Map()
      })
    ).toEqual([]);
  });

  it("finds every render that ended in the same poll", () => {
    expect(
      endedAssetIds({
        previousRenders: snapshotsOf(
          queueItem("a", AssetStatus.INPROGRESS),
          queueItem("b", AssetStatus.INQUEUE)
        ),
        currentRenders: snapshotsOf(
          queueItem("a", AssetStatus.FINISHED),
          queueItem("b", AssetStatus.ERROR)
        )
      })
    ).toEqual(["asset-a", "asset-b"]);
  });

  it("counts an ended render when there is nothing to compare against, which is why the caller skips the first poll", () => {
    expect(
      endedAssetIds({
        previousRenders: new Map(),
        currentRenders: snapshotsOf(queueItem("a", AssetStatus.FINISHED))
      })
    ).toEqual(["asset-a"]);
  });
});
