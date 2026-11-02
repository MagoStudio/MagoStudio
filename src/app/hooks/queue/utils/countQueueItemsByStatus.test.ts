import { AssetStatus } from "@schemas/asset";
import { describe, expect, it } from "vitest";

import {
  countQueueItemsByStatus,
  NO_QUEUE_STATUS_COUNTS
} from "./countQueueItemsByStatus";

describe("countQueueItemsByStatus", () => {
  it("leaves every count undefined for an empty queue", () => {
    expect(countQueueItemsByStatus([])).toEqual(NO_QUEUE_STATUS_COUNTS);
  });

  it("counts finished items as done", () => {
    const counts = countQueueItemsByStatus([
      { status: AssetStatus.FINISHED },
      { status: AssetStatus.FINISHED }
    ]);

    expect(counts.done).toBe(2);
    expect(counts.error).toBeUndefined();
  });

  it("counts both pending and in-queue items as waiting", () => {
    const counts = countQueueItemsByStatus([
      { status: AssetStatus.PENDING },
      { status: AssetStatus.INQUEUE }
    ]);

    expect(counts.waiting).toBe(2);
  });

  it("counts each status independently", () => {
    const counts = countQueueItemsByStatus([
      { status: AssetStatus.FINISHED },
      { status: AssetStatus.ERROR },
      { status: AssetStatus.INPROGRESS },
      { status: AssetStatus.PENDING }
    ]);

    expect(counts).toEqual({
      done: 1,
      error: 1,
      inProgress: 1,
      waiting: 1
    });
  });

  it("ignores statuses it does not track", () => {
    const counts = countQueueItemsByStatus([{ status: "SOMETHING_ELSE" }]);

    expect(counts).toEqual(NO_QUEUE_STATUS_COUNTS);
  });

  it("never mutates the shared empty counts", () => {
    countQueueItemsByStatus([{ status: AssetStatus.FINISHED }]);

    expect(NO_QUEUE_STATUS_COUNTS).toEqual({
      done: undefined,
      error: undefined,
      inProgress: undefined,
      waiting: undefined
    });
  });
});
