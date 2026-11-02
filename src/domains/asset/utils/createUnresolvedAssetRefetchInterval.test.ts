import { describe, expect, it } from "vitest";

import { createUnresolvedAssetRefetchInterval } from "./createUnresolvedAssetRefetchInterval";

interface FakeAsset {
  urlToUse?: string;
}

const POLL_INTERVAL_MS = 5000;

const refetchInterval = createUnresolvedAssetRefetchInterval<FakeAsset>({
  pollIntervalMs: POLL_INTERVAL_MS,
  getPlayableUrl: (assetData) => assetData?.urlToUse
});

describe("createUnresolvedAssetRefetchInterval", () => {
  it("polls while the query succeeded without a playable url", () => {
    const interval = refetchInterval({
      state: { status: "success", data: { urlToUse: "" } }
    });

    expect(interval).toBe(POLL_INTERVAL_MS);
  });

  it("stops polling once a playable url arrives", () => {
    const interval = refetchInterval({
      state: { status: "success", data: { urlToUse: "https://cdn/video.mp4" } }
    });

    expect(interval).toBe(false);
  });

  it("does not poll while the query is still pending", () => {
    const interval = refetchInterval({
      state: { status: "pending", data: undefined }
    });

    expect(interval).toBe(false);
  });

  it("does not poll a query in error state", () => {
    const interval = refetchInterval({
      state: { status: "error", data: undefined }
    });

    expect(interval).toBe(false);
  });

  it("polls when the query succeeded with no data at all", () => {
    const interval = refetchInterval({
      state: { status: "success", data: undefined }
    });

    expect(interval).toBe(POLL_INTERVAL_MS);
  });
});
