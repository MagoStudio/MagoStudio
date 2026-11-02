import { describe, expect, it } from "vitest";

import { QueueItem } from "../interface";

import { attachCloudQueueRow } from "./attachCloudQueueRow";
import { CloudQueueRow } from "./findCloudQueueRowForAsset";

const localQueueItem = (cloudOutputLayerId: string | null) =>
  ({
    id: "job-1",
    local_cloud_render_job_id: "job-1",
    cloud_asset_id: "cloud-asset",
    cloud_output_layer_id: cloudOutputLayerId,
    price: 0
  }) as unknown as QueueItem;

const cloudQueueRow = (
  overrides: Partial<CloudQueueRow> = {}
): CloudQueueRow => ({
  cloudQueueItemId: "cloud-queue-1",
  cloudQueueStatus: "INPROGRESS",
  cloudOutputLayerId: "queue-layer",
  cloudQueuePrice: null,
  cloudQueueEtaSeconds: null,
  ...overrides
});

describe("attachCloudQueueRow", () => {
  it("takes the queue item id, status and layer from the cloud queue row", () => {
    expect(
      attachCloudQueueRow(localQueueItem("stored-layer"), cloudQueueRow())
    ).toMatchObject({
      cloud_queue_item_id: "cloud-queue-1",
      cloud_queue_status: "INPROGRESS",
      cloud_output_layer_id: "queue-layer"
    });
  });

  it("falls back to the stored layer once the render left the cloud queue", () => {
    expect(
      attachCloudQueueRow(localQueueItem("stored-layer"), null)
    ).toMatchObject({
      cloud_queue_item_id: null,
      cloud_queue_status: null,
      cloud_output_layer_id: "stored-layer"
    });
  });

  it("falls back to the stored layer when the queue row has none", () => {
    expect(
      attachCloudQueueRow(
        localQueueItem("stored-layer"),
        cloudQueueRow({
          cloudQueueStatus: "FINISHED",
          cloudOutputLayerId: null
        })
      ).cloud_output_layer_id
    ).toBe("stored-layer");
  });

  it("reports no layer when neither source has one", () => {
    expect(
      attachCloudQueueRow(localQueueItem(null), null).cloud_output_layer_id
    ).toBeNull();
  });

  it("shows the credit price and ETA of the cloud queue row instead of the local placeholder", () => {
    expect(
      attachCloudQueueRow(
        localQueueItem(null),
        cloudQueueRow({ cloudQueuePrice: 12, cloudQueueEtaSeconds: 45 })
      )
    ).toMatchObject({ price: 12, ETA: 45 });
  });

  it("keeps the local price and sets no ETA once the render left the cloud queue", () => {
    const attached = attachCloudQueueRow(localQueueItem(null), null);
    expect(attached.price).toBe(0);
    expect(attached).not.toHaveProperty("ETA");
  });
});
