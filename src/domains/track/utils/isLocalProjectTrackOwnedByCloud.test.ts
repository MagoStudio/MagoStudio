import { describe, expect, it } from "vitest";

import { isLocalProjectTrackOwnedByCloud } from "./isLocalProjectTrackOwnedByCloud";

const cloudProjectWithTrack = (track: Record<string, unknown>) => ({
  id: "project-1",
  origin: "cloud",
  timelines: [{ id: "shot-1", layers: [track] }]
});

describe("isLocalProjectTrackOwnedByCloud", () => {
  it("treats every track of a local project as local", () => {
    expect(
      isLocalProjectTrackOwnedByCloud(
        { id: "project-1", origin: "local", timelines: [] },
        "track-1"
      )
    ).toBe(false);
  });

  it("treats a track without a project read as local", () => {
    expect(isLocalProjectTrackOwnedByCloud(null, "track-1")).toBe(false);
  });

  it("treats a mirrored track of a cloud project as cloud-owned", () => {
    expect(
      isLocalProjectTrackOwnedByCloud(
        cloudProjectWithTrack({ id: "track-1", cloud_mirrored: true }),
        "track-1"
      )
    ).toBe(true);
  });

  it("treats a local-only track of a cloud project as local", () => {
    expect(
      isLocalProjectTrackOwnedByCloud(
        cloudProjectWithTrack({ id: "track-1", cloud_mirrored: false }),
        "track-1"
      )
    ).toBe(false);
  });

  it("treats a cloud project track missing from the library as cloud-owned", () => {
    expect(
      isLocalProjectTrackOwnedByCloud(
        cloudProjectWithTrack({ id: "track-2", cloud_mirrored: false }),
        "track-1"
      )
    ).toBe(true);
  });

  it("treats a cloud project track without an ownership flag as cloud-owned", () => {
    expect(
      isLocalProjectTrackOwnedByCloud(
        cloudProjectWithTrack({ id: "track-1" }),
        "track-1"
      )
    ).toBe(true);
  });
});
