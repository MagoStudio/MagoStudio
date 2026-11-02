import { describe, expect, it } from "vitest";

import { resolveSelectedTrackIds } from "./resolveSelectedTrackIds";

describe("resolveSelectedTrackIds", () => {
  it("keeps an explicit url selection that is still selectable", () => {
    expect(
      resolveSelectedTrackIds({
        trackIdsFromUrl: ["render-1"],
        videoTrackId: "video-1",
        selectableTrackIds: ["video-1", "render-1", "render-2"]
      })
    ).toEqual(["render-1"]);
  });

  it("keeps a multi-track url selection", () => {
    expect(
      resolveSelectedTrackIds({
        trackIdsFromUrl: ["render-1", "render-2"],
        videoTrackId: "video-1",
        selectableTrackIds: ["video-1", "render-1", "render-2"]
      })
    ).toEqual(["render-1", "render-2"]);
  });

  it("falls back to the video track when the url carries no selection", () => {
    expect(
      resolveSelectedTrackIds({
        trackIdsFromUrl: [],
        videoTrackId: "video-1",
        selectableTrackIds: ["video-1", "render-1"]
      })
    ).toEqual(["video-1"]);
  });

  it("falls back to the video track when every url id is stale", () => {
    expect(
      resolveSelectedTrackIds({
        trackIdsFromUrl: ["render-from-another-shot"],
        videoTrackId: "video-1",
        selectableTrackIds: ["video-1", "render-1"]
      })
    ).toEqual(["video-1"]);
  });

  it("drops only the stale ids from a partially stale url selection", () => {
    expect(
      resolveSelectedTrackIds({
        trackIdsFromUrl: ["render-1", "render-from-another-shot"],
        videoTrackId: "video-1",
        selectableTrackIds: ["video-1", "render-1"]
      })
    ).toEqual(["render-1"]);
  });

  it("returns nothing when the url is empty and the shot has no video track", () => {
    expect(
      resolveSelectedTrackIds({
        trackIdsFromUrl: [],
        videoTrackId: undefined,
        selectableTrackIds: []
      })
    ).toEqual([]);
  });

  it("returns nothing when every url id is stale and there is no video track", () => {
    expect(
      resolveSelectedTrackIds({
        trackIdsFromUrl: ["render-from-another-shot"],
        videoTrackId: undefined,
        selectableTrackIds: ["render-1"]
      })
    ).toEqual([]);
  });

  it("selects the video track itself when the url names it", () => {
    expect(
      resolveSelectedTrackIds({
        trackIdsFromUrl: ["video-1"],
        videoTrackId: "video-1",
        selectableTrackIds: ["video-1", "render-1"]
      })
    ).toEqual(["video-1"]);
  });
});
