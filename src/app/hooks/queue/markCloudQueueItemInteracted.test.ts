import { AssetStatus } from "@schemas/asset";
import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendApiClient } from "@/lib/backend-api-client";

import { QueueItem } from "./interface";
import { markCloudQueueItemInteracted } from "./markCloudQueueItemInteracted";

const desktopApi = vi.hoisted(() => ({
  imageRenders: { cancel: vi.fn(), markInteracted: vi.fn() }
}));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get: vi.fn(), delete: vi.fn(), put: vi.fn() }
}));

vi.mock("@/platform/localDesktop", () => ({
  getLocalDesktopApi: () => desktopApi
}));

const queueItem = (overrides: Partial<QueueItem> = {}): QueueItem =>
  ({
    id: "local-job-1",
    asset_id: "local-asset-1",
    layer_id: "local-track-1",
    status: AssetStatus.FINISHED,
    render_provider: "mago-cloud",
    local_cloud_render_job_id: "local-job-1",
    cloud_asset_id: "cloud-asset-1",
    ...overrides
  }) as QueueItem;

describe("markCloudQueueItemInteracted", () => {
  beforeEach(() => vi.resetAllMocks());

  it("marks the local job and the cloud queue item as interacted", async () => {
    await markCloudQueueItemInteracted(
      queueItem({ cloud_queue_item_id: "cloud-queue-1" })
    );

    expect(desktopApi.imageRenders.markInteracted).toHaveBeenCalledWith(
      "local-job-1"
    );
    expect(backendApiClient.put).toHaveBeenCalledWith(
      "/queue/interaction/cloud-queue-1"
    );
  });

  it("looks the cloud queue item up by cloud asset when it is not cached", async () => {
    vi.mocked(backendApiClient.get).mockResolvedValue({
      data: [{ id: "cloud-queue-1", asset_id: "cloud-asset-1" }]
    });

    await markCloudQueueItemInteracted(queueItem());

    expect(backendApiClient.put).toHaveBeenCalledWith(
      "/queue/interaction/cloud-queue-1"
    );
  });

  it("marks a backend-only render by its own id without touching local jobs", async () => {
    await markCloudQueueItemInteracted(
      queueItem({
        id: "cloud-queue-2",
        local_cloud_render_job_id: undefined,
        cloud_asset_id: undefined
      })
    );

    expect(desktopApi.imageRenders.markInteracted).not.toHaveBeenCalled();
    expect(backendApiClient.put).toHaveBeenCalledWith(
      "/queue/interaction/cloud-queue-2"
    );
  });

  it("ignores a cloud queue item that has already expired", async () => {
    vi.mocked(backendApiClient.put).mockRejectedValue(
      new AxiosError("Not found", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 404,
        statusText: "",
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: {}
      })
    );

    await expect(
      markCloudQueueItemInteracted(
        queueItem({ cloud_queue_item_id: "cloud-queue-1" })
      )
    ).resolves.toBeUndefined();
  });
});
