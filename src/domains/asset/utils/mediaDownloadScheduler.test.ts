import { describe, expect, it, vi } from "vitest";

import { MediaDownloadScheduler } from "./mediaDownloadScheduler";

const deferred = () => {
  let resolve!: (value: string) => void;
  const promise = new Promise<string>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
};

describe("media downloads", () => {
  it("batches publication for a large enqueue burst", async () => {
    const scheduler = new MediaDownloadScheduler();
    const listener = vi.fn();
    scheduler.subscribe(listener);
    for (let index = 0; index < 5000; index += 1) {
      void scheduler.enqueue({
        key: `video:${index}`,
        assetId: String(index),
        kind: "video",
        run: () => new Promise(() => {})
      });
    }
    expect(listener).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(listener).toHaveBeenCalledTimes(2);
    expect(scheduler.getSnapshot()).toEqual({
      queued: 4999,
      downloading: 1,
      ready: 0,
      failed: 0
    });
  });
  it("shares one video slot while allowing images in parallel and deduplicating requests", async () => {
    const scheduler = new MediaDownloadScheduler();
    const first = deferred();
    const video = vi.fn(() => first.promise);
    const second = vi.fn(async () => "second");
    const image = vi.fn(async () => "image");
    const a = scheduler.enqueue({
      key: "video:a",
      assetId: "a",
      kind: "video",
      run: video
    });
    const duplicate = scheduler.enqueue({
      key: "video:a",
      assetId: "a",
      kind: "video",
      run: second
    });
    const b = scheduler.enqueue({
      key: "video:b",
      assetId: "b",
      kind: "video",
      run: second
    });
    const c = scheduler.enqueue({
      key: "image:c",
      assetId: "c",
      kind: "image",
      run: image
    });
    await vi.waitFor(() => expect(image).toHaveBeenCalledOnce());
    expect(video).toHaveBeenCalledOnce();
    expect(second).not.toHaveBeenCalled();
    first.resolve("first");
    expect(await Promise.all([a, duplicate, b, c])).toEqual([
      "first",
      "first",
      "second",
      "image"
    ]);
  });

  it("interrupts an obsolete video, serves visible work, then resumes background work", async () => {
    const scheduler = new MediaDownloadScheduler();
    scheduler.setForeground("huge");
    const started: string[] = [];
    let interrupted = false;
    const background = scheduler.enqueue({
      key: "video:old",
      assetId: "old",
      projectId: "huge",
      kind: "video",
      run: (signal) => {
        started.push("old");
        if (interrupted) return Promise.resolve("old");
        return new Promise<string>((_resolve, reject) =>
          signal.addEventListener(
            "abort",
            () => {
              interrupted = true;
              reject(signal.reason);
            },
            { once: true }
          )
        );
      }
    });
    await vi.waitFor(() => expect(started).toEqual(["old"]));
    scheduler.setForeground("new");
    const release = scheduler.demand("visible");
    const foreground = scheduler.enqueue({
      key: "video:visible",
      assetId: "visible",
      projectId: "new",
      kind: "video",
      run: async () => {
        started.push("visible");
        return "visible";
      }
    });
    await Promise.all([background, foreground]);
    release();
    expect(started).toEqual(["old", "visible", "old"]);
  });

  it("updates scrolling priorities, removes stale visibility, and preserves document order", async () => {
    const scheduler = new MediaDownloadScheduler();
    const block = deferred();
    const releaseOld = scheduler.demand("above");
    const blocker = scheduler.enqueue({
      key: "video:player",
      assetId: "player",
      kind: "video",
      run: () => block.promise
    });
    const releasePlayer = scheduler.demand("player", 4);
    await Promise.resolve();
    const order: string[] = [];
    const jobs = ["above", "below", "next"].map((assetId) =>
      scheduler.enqueue({
        key: `video:${assetId}`,
        assetId,
        kind: "video",
        run: async () => {
          order.push(assetId);
          return assetId;
        }
      })
    );
    releaseOld();
    const releaseBelow = scheduler.demand("below");
    block.resolve("player");
    await Promise.all([blocker, ...jobs]);
    releaseBelow();
    releasePlayer();
    expect(order).toEqual(["below", "above", "next"]);
  });

  it("does not interrupt downloads when navigating to a fully cached project", async () => {
    const scheduler = new MediaDownloadScheduler();
    const block = deferred();
    let signal!: AbortSignal;
    const job = scheduler.enqueue({
      key: "video:bg",
      assetId: "bg",
      projectId: "huge",
      kind: "video",
      run: (value) => {
        signal = value;
        return block.promise;
      }
    });
    await vi.waitFor(() => expect(signal).toBeDefined());
    scheduler.setForeground("cached");
    expect(signal.aborted).toBe(false);
    block.resolve("done");
    await job;
  });

  it("reports failure, keeps the queue moving, and retries on demand", async () => {
    const scheduler = new MediaDownloadScheduler();
    const run = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce("ok");
    await expect(
      scheduler.enqueue({
        key: "video:failed",
        assetId: "failed",
        kind: "video",
        run
      })
    ).rejects.toThrow("offline");
    expect(scheduler.getAssetState("failed")).toBe("failed");
    await scheduler.retryAsset("failed");
    await vi.waitFor(() =>
      expect(scheduler.getAssetState("failed")).toBe("ready")
    );
    expect(run).toHaveBeenCalledTimes(2);
  });
});
