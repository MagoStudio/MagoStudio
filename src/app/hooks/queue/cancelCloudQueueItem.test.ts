import { AssetStatus } from "@schemas/asset";
import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendApiClient } from "@/lib/backend-api-client";

import { cancelCloudQueueItem } from "./cancelCloudQueueItem";
import { QueueItem } from "./interface";

const desktopApi = vi.hoisted(() => ({
  imageRenders: { cancel: vi.fn(), markInteracted: vi.fn() }
}));

vi.mock("@/lib/backend-api-client", () => ({
  backendApiClient: { get: vi.fn(), delete: vi.fn(), put: vi.fn() }
}));

vi.mock("@/platform/localDesktop", () => ({
  getLocalDesktopApi: () => desktopApi
}));

const notFoundError = () =>
  new AxiosError("Not found", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 404,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {}
  });

const queueItem = (overrides: Partial<QueueItem> = {}): QueueItem =>
  ({
    id: "local-job-1",
    asset_id: "local-asset-1",
    layer_id: "local-track-1",
    status: AssetStatus.PENDING,
    render_provider: "mago-cloud",
    local_cloud_render_job_id: "local-job-1",
    cloud_asset_id: "cloud-asset-1",
    ...overrides
  }) as QueueItem;

describe("cancelCloudQueueItem", () => {
  beforeEach(() => vi.resetAllMocks());

  it("deletes the cloud queue item of a locally tracked render and cancels the local job", async () => {
    await cancelCloudQueueItem({
      queueItem: queueItem({
        cloud_queue_item_id: "cloud-queue-1",
        cloud_output_layer_id: "cloud-layer-1"
      }),
      shouldDeleteCloudOutputLayer: false
    });

    expect(backendApiClient.delete).toHaveBeenCalledTimes(1);
    expect(backendApiClient.delete).toHaveBeenCalledWith(
      "/queue/cloud-queue-1"
    );
    expect(desktopApi.imageRenders.cancel).toHaveBeenCalledWith("local-job-1");
  });

  it("looks the cloud queue item up by cloud asset when it is not cached", async () => {
    vi.mocked(backendApiClient.get).mockResolvedValue({
      data: [
        {
          id: "cloud-queue-1",
          asset_id: "cloud-asset-1",
          status: "PENDING",
          layer_id: "cloud-layer-1"
        }
      ]
    });

    await cancelCloudQueueItem({
      queueItem: queueItem(),
      shouldDeleteCloudOutputLayer: true
    });

    expect(backendApiClient.get).toHaveBeenCalledWith("/queue");
    expect(vi.mocked(backendApiClient.delete).mock.calls).toEqual([
      ["/queue/cloud-queue-1"],
      ["/layers/cloud-layer-1"]
    ]);
    expect(desktopApi.imageRenders.cancel).toHaveBeenCalledWith("local-job-1");
  });

  it("still cancels the local job when the cloud no longer lists the render", async () => {
    vi.mocked(backendApiClient.get).mockResolvedValue({ data: [] });

    await cancelCloudQueueItem({
      queueItem: queueItem(),
      shouldDeleteCloudOutputLayer: true
    });

    expect(backendApiClient.delete).not.toHaveBeenCalled();
    expect(desktopApi.imageRenders.cancel).toHaveBeenCalledWith("local-job-1");
  });

  it("deletes the stored cloud output layer when the cloud no longer lists the render", async () => {
    vi.mocked(backendApiClient.get).mockResolvedValue({ data: [] });

    await cancelCloudQueueItem({
      queueItem: queueItem({ cloud_output_layer_id: "cloud-layer-stored" }),
      shouldDeleteCloudOutputLayer: true
    });

    expect(vi.mocked(backendApiClient.delete).mock.calls).toEqual([
      ["/layers/cloud-layer-stored"]
    ]);
    expect(desktopApi.imageRenders.cancel).toHaveBeenCalledWith("local-job-1");
  });

  it("treats a cloud queue item that is already gone as cancelled", async () => {
    vi.mocked(backendApiClient.delete).mockRejectedValue(notFoundError());

    await cancelCloudQueueItem({
      queueItem: queueItem({ cloud_queue_item_id: "cloud-queue-1" }),
      shouldDeleteCloudOutputLayer: false
    });

    expect(desktopApi.imageRenders.cancel).toHaveBeenCalledWith("local-job-1");
  });

  it("keeps the local job running when the cloud refuses the cancel", async () => {
    vi.mocked(backendApiClient.delete).mockRejectedValue(new Error("offline"));

    await expect(
      cancelCloudQueueItem({
        queueItem: queueItem({ cloud_queue_item_id: "cloud-queue-1" }),
        shouldDeleteCloudOutputLayer: false
      })
    ).rejects.toThrow("offline");
    expect(desktopApi.imageRenders.cancel).not.toHaveBeenCalled();
  });

  it("deletes a backend-only render by its own id and leaves its layer to the track delete", async () => {
    await cancelCloudQueueItem({
      queueItem: queueItem({
        id: "cloud-queue-2",
        layer_id: "cloud-layer-2",
        local_cloud_render_job_id: undefined,
        cloud_asset_id: undefined
      }),
      shouldDeleteCloudOutputLayer: true
    });

    expect(vi.mocked(backendApiClient.delete).mock.calls).toEqual([
      ["/queue/cloud-queue-2"]
    ]);
    expect(desktopApi.imageRenders.cancel).not.toHaveBeenCalled();
  });
});
