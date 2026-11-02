import { describe, expect, test } from "vitest";

import { getUnfinishedQueuePositions } from "./queuePosition";

describe("getUnfinishedQueuePositions", () => {
  test("excludes finished, errored, and cancelled jobs", () => {
    const positions = getUnfinishedQueuePositions([
      { id: "finished", status: "FINISHED" },
      { id: "running", status: "INPROGRESS" },
      { id: "error", status: "ERROR" },
      { id: "queued", status: "INQUEUE" },
      { id: "cancelled", status: "CANCELLED" },
      { id: "pending", status: "PENDING" }
    ]);

    expect([...positions.entries()]).toEqual([
      ["running", 0],
      ["queued", 1],
      ["pending", 2]
    ]);
  });
});
