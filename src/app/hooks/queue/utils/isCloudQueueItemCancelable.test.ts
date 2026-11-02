import { AssetStatus } from "@schemas/asset";
import { describe, expect, it } from "vitest";

import { isCloudQueueItemCancelable } from "./isCloudQueueItemCancelable";

describe("isCloudQueueItemCancelable", () => {
  it("follows the cloud queue status of a locally tracked render, not the local job status", () => {
    expect(
      isCloudQueueItemCancelable({
        status: AssetStatus.INQUEUE,
        local_cloud_render_job_id: "local-job-1",
        cloud_queue_status: AssetStatus.PENDING,
        display_order: 3
      })
    ).toBe(true);
    expect(
      isCloudQueueItemCancelable({
        status: AssetStatus.PENDING,
        local_cloud_render_job_id: "local-job-1",
        cloud_queue_status: AssetStatus.INPROGRESS,
        display_order: 1
      })
    ).toBe(false);
  });

  it("refuses to cancel a locally tracked render whose cloud queue status is unknown", () => {
    expect(
      isCloudQueueItemCancelable({
        status: AssetStatus.PENDING,
        local_cloud_render_job_id: "local-job-1",
        cloud_queue_status: null,
        display_order: 2
      })
    ).toBe(false);
  });

  it("uses the status of a backend-only render directly", () => {
    expect(
      isCloudQueueItemCancelable({
        status: AssetStatus.PENDING,
        display_order: 2
      })
    ).toBe(true);
    expect(
      isCloudQueueItemCancelable({
        status: AssetStatus.INQUEUE,
        display_order: 2
      })
    ).toBe(false);
  });

  it("keeps a render at the head of the queue uncancelable", () => {
    expect(
      isCloudQueueItemCancelable({
        status: AssetStatus.PENDING,
        display_order: 0
      })
    ).toBe(false);
  });
});
