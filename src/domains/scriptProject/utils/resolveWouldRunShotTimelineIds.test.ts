import { describe, expect, it } from "vitest";

import { resolveWouldRunShotTimelineIds } from "./resolveWouldRunShotTimelineIds";

const shots = [
  { timeline_id: "timeline-8a", sequence_id: 8 },
  { timeline_id: "timeline-8b", sequence_id: 8 },
  { timeline_id: "timeline-9", sequence_id: 9 }
];

describe("resolveWouldRunShotTimelineIds", () => {
  it("names one beat of a scene rather than the whole scene", () => {
    const timelineIds = resolveWouldRunShotTimelineIds(
      {
        would_run: [8],
        would_run_timeline_ids: ["timeline-8b"]
      },
      shots
    );

    expect(timelineIds).toEqual(["timeline-8b"]);
  });

  it("falls back to matching by sequence id when the answer carries no timeline ids", () => {
    const timelineIds = resolveWouldRunShotTimelineIds(
      { would_run: [9], would_run_timeline_ids: [] },
      shots
    );

    expect(timelineIds).toEqual(["timeline-9"]);
  });

  it("returns nothing before the dry run has answered", () => {
    expect(resolveWouldRunShotTimelineIds(undefined, shots)).toEqual([]);
  });
});
