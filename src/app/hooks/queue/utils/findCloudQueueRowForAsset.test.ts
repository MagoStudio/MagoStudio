import { describe, expect, it } from "vitest";

import { findCloudQueueRowForAsset } from "./findCloudQueueRowForAsset";

describe("findCloudQueueRowForAsset", () => {
  it("returns the queue item id, status and output layer of the matching render", () => {
    const cloudQueueResponse = [
      { id: "queue-other", asset_id: "asset-other", status: "INPROGRESS" },
      {
        id: "queue-1",
        asset_id: "asset-1",
        status: "PENDING",
        layer_id: "layer-1"
      }
    ];

    expect(findCloudQueueRowForAsset(cloudQueueResponse, "asset-1")).toEqual({
      cloudQueueItemId: "queue-1",
      cloudQueueStatus: "PENDING",
      cloudOutputLayerId: "layer-1",
      cloudQueuePrice: null,
      cloudQueueEtaSeconds: null
    });
  });

  it("returns the credit price and ETA the cloud queue reports for the render", () => {
    expect(
      findCloudQueueRowForAsset(
        [{ id: "queue-1", asset_id: "asset-1", price: 12, ETA: 45 }],
        "asset-1"
      )
    ).toMatchObject({ cloudQueuePrice: 12, cloudQueueEtaSeconds: 45 });
  });

  it("reads a paginated response", () => {
    expect(
      findCloudQueueRowForAsset(
        { items: [{ id: "queue-1", asset_id: "asset-1" }] },
        "asset-1"
      )
    ).toEqual({
      cloudQueueItemId: "queue-1",
      cloudQueueStatus: null,
      cloudOutputLayerId: null,
      cloudQueuePrice: null,
      cloudQueueEtaSeconds: null
    });
  });

  it("returns null when no queue item renders the asset", () => {
    expect(
      findCloudQueueRowForAsset(
        [{ id: "queue-1", asset_id: "asset-other" }],
        "asset-1"
      )
    ).toBeNull();
  });

  it("skips rows without an id and survives a malformed response", () => {
    expect(
      findCloudQueueRowForAsset([null, { asset_id: "asset-1" }], "asset-1")
    ).toBeNull();
    expect(findCloudQueueRowForAsset("not a queue", "asset-1")).toBeNull();
  });
});
