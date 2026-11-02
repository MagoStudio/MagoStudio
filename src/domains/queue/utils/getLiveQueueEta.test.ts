import { type QueueItem } from "@hooks/queue/interface";
import { AssetStatus } from "@schemas/asset";
import { describe, expect, test } from "vitest";

import { getLiveQueueEta } from "./getLiveQueueEta";

const item = (overrides: Partial<QueueItem>): QueueItem =>
  ({ status: AssetStatus.INPROGRESS, ...overrides }) as QueueItem;

describe("getLiveQueueEta", () => {
  test("counts down from the stable estimated end time", () => {
    expect(
      getLiveQueueEta(
        item({ estimated_end_time: "2026-08-07T12:08:00.000Z", ETA: 999 }),
        new Date("2026-08-07T12:02:00.000Z").getTime()
      )
    ).toBe(360_000);
  });

  test("clamps overdue renders to zero", () => {
    expect(
      getLiveQueueEta(
        item({ estimated_end_time: "2026-08-07T12:08:00.000Z" }),
        new Date("2026-08-07T12:10:00.000Z").getTime()
      )
    ).toBe(0);
  });

  test("falls back to the server countdown and ignores queued jobs", () => {
    expect(getLiveQueueEta(item({ ETA: 12 }), 0)).toBe(12_000);
    expect(
      getLiveQueueEta(item({ status: AssetStatus.INQUEUE, ETA: 12 }), 0)
    ).toBeUndefined();
  });
});
