import { describe, expect, it } from "vitest";

import {
  elapsedRenderMs,
  parseServerTimestamp,
  findQueueItemForAsset,
  parseQueueItems,
  queuePositionForAsset,
  toJobStatus
} from "./queueStatus";

/** The exact shape staging returned for a finished render. */
const STAGING_ITEM = {
  id: "131a6c47-460d-421c-a9ca-7577e1abae3b",
  user_id: "user_fixture",
  status: "FINISHED",
  asset_id: "1920ee6b-9af9-4e23-bb98-d72529f826fc",
  created_at: "2026-08-28T08:57:35.161719+00:00",
  finished_at: "2026-08-28T09:00:15.133995",
  render_started_at: "2026-08-28T08:57:41.133539",
  active: true
};

describe("parseQueueItems", () => {
  it("reads the shape staging actually returns", () => {
    const [item] = parseQueueItems([STAGING_ITEM]);

    expect(item).toEqual({
      id: STAGING_ITEM.id,
      status: "FINISHED",
      assetId: STAGING_ITEM.asset_id,
      createdAt: STAGING_ITEM.created_at,
      renderStartedAt: STAGING_ITEM.render_started_at,
      finishedAt: STAGING_ITEM.finished_at,
      progress: null,
      failure: null
    });
  });

  it("carries the failure reason when the server recorded one", () => {
    expect(
      parseQueueItems([
        { ...STAGING_ITEM, rejected_reason: "Out of credits" }
      ])[0]?.failure
    ).toBe("Out of credits");
    expect(
      parseQueueItems([
        { ...STAGING_ITEM, error: { message: "bad frame range" } }
      ])[0]?.failure
    ).toBe("bad frame range");
  });

  it("reports no reason rather than inventing one", () => {
    // Observed on staging: a failed render with error {} and rejected_reason
    // null, because the detail stays in the renderer's own logs.
    expect(
      parseQueueItems([
        { ...STAGING_ITEM, status: "ERROR", error: {}, rejected_reason: null }
      ])[0]?.failure
    ).toBeNull();
  });

  it("reads progress when the queue reports it", () => {
    expect(
      parseQueueItems([{ ...STAGING_ITEM, progress: 42 }])[0]?.progress
    ).toBe(42);
    expect(parseQueueItems([STAGING_ITEM])[0]?.progress).toBeNull();
  });

  it("accepts an items-wrapped response as well as a bare array", () => {
    expect(parseQueueItems({ items: [STAGING_ITEM] })).toHaveLength(1);
  });

  it("skips rows with no id or no asset, and non-array responses", () => {
    expect(
      parseQueueItems([{ id: "x" }, { asset_id: "y" }, null, "nonsense"])
    ).toEqual([]);
    expect(parseQueueItems(null)).toEqual([]);
    expect(parseQueueItems({ error: "nope" })).toEqual([]);
  });
});

describe("toJobStatus", () => {
  const item = (status: string, renderStartedAt: string | null = null) => ({
    id: "q",
    status,
    assetId: "a",
    createdAt: null,
    renderStartedAt,
    finishedAt: null,
    progress: null,
    failure: null
  });

  it("maps the finished statuses to success", () => {
    for (const status of ["FINISHED", "SUCCESS", "COMPLETED", "done"]) {
      expect(toJobStatus(item(status))).toBe("SUCCESS");
    }
  });

  it("maps failures and cancellations apart", () => {
    for (const status of ["FAILED", "ERROR", "TIMEOUT"]) {
      expect(toJobStatus(item(status))).toBe("FAILED");
    }
    for (const status of ["CANCELLED", "CANCELED", "ENDED"]) {
      expect(toJobStatus(item(status))).toBe("CANCELLED");
    }
  });

  it("distinguishes queued from running, which the asset endpoint cannot", () => {
    expect(toJobStatus(item("INQUEUE"))).toBe("INQUEUE");
    expect(toJobStatus(item("INPROGRESS"))).toBe("INPROGRESS");
  });

  it("reads the status field, not render_started_at, which prod fills with now", () => {
    expect(toJobStatus(item("PAUSED", "2026-08-28T08:57:41"))).toBe("INQUEUE");
    expect(toJobStatus(item("INQUEUE", "2026-08-28T08:57:41"))).toBe("INQUEUE");
    expect(toJobStatus(item("SOMETHING_NEW", "2026-08-28T08:57:41"))).toBe(
      "INQUEUE"
    );
  });

  it("never reports an unknown status as finished", () => {
    // A new server-side status must not make a job look done before its output
    // exists, or the download would fire against nothing.
    expect(toJobStatus(item("BRAND_NEW_STATUS"))).toBe("INQUEUE");
    expect(toJobStatus(item(""))).toBe("INQUEUE");
  });
});

describe("findQueueItemForAsset", () => {
  it("finds the item belonging to a render output", () => {
    expect(
      findQueueItemForAsset([STAGING_ITEM], STAGING_ITEM.asset_id)?.id
    ).toBe(STAGING_ITEM.id);
  });

  it("returns null when the render is not in the queue", () => {
    expect(findQueueItemForAsset([STAGING_ITEM], "other")).toBeNull();
  });
});

describe("queuePositionForAsset", () => {
  const queued = (assetId: string, createdAt: string) => ({
    id: `q-${assetId}`,
    status: "INQUEUE",
    asset_id: assetId,
    created_at: createdAt,
    render_started_at: null,
    finished_at: null
  });

  it("orders waiting renders oldest first", () => {
    const response = [
      queued("c", "2026-08-28T10:00:03"),
      queued("a", "2026-08-28T10:00:01"),
      queued("b", "2026-08-28T10:00:02")
    ];

    expect(queuePositionForAsset(response, "a")).toBe(1);
    expect(queuePositionForAsset(response, "b")).toBe(2);
    expect(queuePositionForAsset(response, "c")).toBe(3);
  });

  it("ignores renders that are already running or done", () => {
    const response = [STAGING_ITEM, queued("a", "2026-08-28T10:00:01")];

    expect(queuePositionForAsset(response, "a")).toBe(1);
    expect(queuePositionForAsset(response, STAGING_ITEM.asset_id)).toBeNull();
  });
});

describe("parseServerTimestamp", () => {
  it("reads a timestamp with an offset as given", () => {
    expect(parseServerTimestamp("2026-08-28T08:57:35.161719+00:00")).toBe(
      Date.parse("2026-08-28T08:57:35.161Z")
    );
  });

  it("reads a timestamp with no timezone as UTC, not local", () => {
    // The queue returns render_started_at and finished_at naive; treating them
    // as local time would skew elapsed times by the viewer's UTC offset.
    expect(parseServerTimestamp("2026-08-28T08:57:41.133539")).toBe(
      Date.parse("2026-08-28T08:57:41.133Z")
    );
  });

  it("returns null for nothing and for nonsense", () => {
    expect(parseServerTimestamp(null)).toBeNull();
    expect(parseServerTimestamp("not a date")).toBeNull();
  });
});

describe("elapsedRenderMs", () => {
  it("measures a finished render between its own timestamps", () => {
    const [item] = parseQueueItems([STAGING_ITEM]);
    // 08:57:41.133 to 09:00:15.133 is 154 seconds.
    expect(elapsedRenderMs(item!, Date.parse("2026-08-28T12:00:00Z"))).toBe(
      154_000
    );
  });

  it("measures a running render up to now", () => {
    const [item] = parseQueueItems([
      { ...STAGING_ITEM, finished_at: null, status: "INPROGRESS" }
    ]);
    const now = Date.parse("2026-08-28T08:58:41.133539Z");

    expect(elapsedRenderMs(item!, now)).toBe(60_000);
  });

  it("has nothing to report for a queued render whatever its start time says", () => {
    const [item] = parseQueueItems([
      { ...STAGING_ITEM, status: "INQUEUE", finished_at: null }
    ]);

    expect(elapsedRenderMs(item!, Date.now())).toBeNull();
  });

  it("has nothing to report before the render starts", () => {
    const [item] = parseQueueItems([
      { ...STAGING_ITEM, render_started_at: null }
    ]);

    expect(elapsedRenderMs(item!, Date.now())).toBeNull();
  });
});
