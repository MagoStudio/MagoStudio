import { type QueueItem } from "@hooks/queue/interface";
import { AssetStatus } from "@schemas/asset";
import { type TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import { getQueueStatusText } from "./getQueueStatusText";

const t = ((key: string) => `t:${key}`) as unknown as TFunction;

const item = (status: AssetStatus, display_order?: number): QueueItem =>
  ({ status, display_order }) as QueueItem;

describe("getQueueStatusText", () => {
  it("localizes the error label", () => {
    expect(getQueueStatusText(item(AssetStatus.ERROR), undefined, t)).toBe(
      "t:status.failed.label"
    );
  });

  it("renders the queue position for PENDING items", () => {
    expect(getQueueStatusText(item(AssetStatus.PENDING, 2), undefined, t)).toBe(
      "In Queue: 3rd"
    );
    expect(getQueueStatusText(item(AssetStatus.PENDING, 0), undefined, t)).toBe(
      ""
    );
  });

  it("shows 'next' for the head of the INQUEUE, ordinal otherwise", () => {
    expect(getQueueStatusText(item(AssetStatus.INQUEUE, 0), undefined, t)).toBe(
      "t:status.in_queue_next.label"
    );
    expect(getQueueStatusText(item(AssetStatus.INQUEUE, 3), undefined, t)).toBe(
      "In Queue: 4th"
    );
  });

  it("returns an empty string when the queue position is unknown", () => {
    expect(
      getQueueStatusText(item(AssetStatus.PENDING, undefined), undefined, t)
    ).toBe("");
    expect(
      getQueueStatusText(item(AssetStatus.INQUEUE, undefined), undefined, t)
    ).toBe("");
  });

  it("localizes the paused label", () => {
    expect(getQueueStatusText(item(AssetStatus.PAUSED), undefined, t)).toBe(
      "t:status.paused.label"
    );
  });

  it("maps INPROGRESS ETA states", () => {
    expect(getQueueStatusText(item(AssetStatus.INPROGRESS), undefined, t)).toBe(
      "t:status.starting.label"
    );
    expect(getQueueStatusText(item(AssetStatus.INPROGRESS), 0, t)).toBe(
      "t:status.still_in_progress.label"
    );
    expect(getQueueStatusText(item(AssetStatus.INPROGRESS), 90_000, t)).toBe(
      " 00:01:30"
    );
  });

  it("localizes the finished and cancelled labels", () => {
    expect(getQueueStatusText(item(AssetStatus.FINISHED), undefined, t)).toBe(
      "t:status.done.label"
    );
    expect(getQueueStatusText(item(AssetStatus.CANCELLED), undefined, t)).toBe(
      "t:status.cancelled.label"
    );
  });

  it("returns an empty string for an unhandled status", () => {
    expect(
      getQueueStatusText(item("SOMETHING_ELSE" as AssetStatus), undefined, t)
    ).toBe("");
  });
});
