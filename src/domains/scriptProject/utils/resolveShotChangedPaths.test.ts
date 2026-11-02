import { describe, expect, it } from "vitest";

import { resolveShotChangedPaths } from "./resolveShotChangedPaths";

const shot = {
  timeline_id: "timeline-8b",
  sequence_id: 8,
  key: "8.2"
};

describe("resolveShotChangedPaths", () => {
  it("reads the diff addressed by timeline id", () => {
    const changedPaths = resolveShotChangedPaths(
      {
        changed: { "8.2": ["video_prompt"] },
        changed_by_timeline_id: { "timeline-8b": ["settings.frame_range"] }
      },
      shot
    );

    expect(changedPaths).toEqual(["settings.frame_range"]);
  });

  it("falls back to the display key when only that diff is present", () => {
    const changedPaths = resolveShotChangedPaths(
      {
        changed: { "8.2": ["video_prompt"] },
        changed_by_timeline_id: {}
      },
      shot
    );

    expect(changedPaths).toEqual(["video_prompt"]);
  });

  it("falls back to the sequence id for a Shot written before keys existed", () => {
    const changedPaths = resolveShotChangedPaths(
      { changed: { "8": ["video_prompt"] }, changed_by_timeline_id: {} },
      { timeline_id: "timeline-8", sequence_id: 8, key: null }
    );

    expect(changedPaths).toEqual(["video_prompt"]);
  });

  it("is undefined for a Shot no diff mentions", () => {
    expect(
      resolveShotChangedPaths({ changed: {}, changed_by_timeline_id: {} }, shot)
    ).toBeUndefined();
  });
});
