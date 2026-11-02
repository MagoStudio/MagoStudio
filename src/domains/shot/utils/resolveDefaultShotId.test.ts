import { describe, expect, it } from "vitest";

import { resolveDefaultShotId } from "./resolveDefaultShotId";

describe("resolveDefaultShotId", () => {
  it("prefers the last-viewed shot when it is still in the list", () => {
    expect(
      resolveDefaultShotId({
        lastViewedShotId: "shot-b",
        shotIdsByMostRecentlyEdited: ["shot-a", "shot-b", "shot-c"],
        excludedShotIds: []
      })
    ).toBe("shot-b");
  });

  it("falls back to the most recently edited shot when nothing was last viewed", () => {
    expect(
      resolveDefaultShotId({
        lastViewedShotId: null,
        shotIdsByMostRecentlyEdited: ["shot-a", "shot-b"],
        excludedShotIds: []
      })
    ).toBe("shot-a");
  });

  it("falls back to the most recently edited shot when the last-viewed shot was deleted", () => {
    expect(
      resolveDefaultShotId({
        lastViewedShotId: "shot-deleted",
        shotIdsByMostRecentlyEdited: ["shot-a", "shot-b"],
        excludedShotIds: []
      })
    ).toBe("shot-a");
  });

  it("returns the only shot for a single-shot project", () => {
    expect(
      resolveDefaultShotId({
        lastViewedShotId: null,
        shotIdsByMostRecentlyEdited: ["shot-only"],
        excludedShotIds: []
      })
    ).toBe("shot-only");
  });

  it("returns undefined for a project with no shots", () => {
    expect(
      resolveDefaultShotId({
        lastViewedShotId: null,
        shotIdsByMostRecentlyEdited: [],
        excludedShotIds: []
      })
    ).toBeUndefined();
  });

  it("returns undefined when the last-viewed shot is stale and the project has no shots left", () => {
    expect(
      resolveDefaultShotId({
        lastViewedShotId: "shot-deleted",
        shotIdsByMostRecentlyEdited: [],
        excludedShotIds: []
      })
    ).toBeUndefined();
  });

  it("ignores an empty-string last-viewed id", () => {
    expect(
      resolveDefaultShotId({
        lastViewedShotId: "",
        shotIdsByMostRecentlyEdited: ["shot-a"],
        excludedShotIds: []
      })
    ).toBe("shot-a");
  });

  it("skips the excluded shot and takes the next most recently edited one", () => {
    expect(
      resolveDefaultShotId({
        lastViewedShotId: null,
        shotIdsByMostRecentlyEdited: ["shot-i2v", "shot-a", "shot-b"],
        excludedShotIds: ["shot-i2v"]
      })
    ).toBe("shot-a");
  });

  it("returns undefined when the excluded shot is the only shot", () => {
    expect(
      resolveDefaultShotId({
        lastViewedShotId: null,
        shotIdsByMostRecentlyEdited: ["shot-i2v"],
        excludedShotIds: ["shot-i2v"]
      })
    ).toBeUndefined();
  });

  it("never returns the excluded shot even when it was the last viewed one", () => {
    expect(
      resolveDefaultShotId({
        lastViewedShotId: "shot-i2v",
        shotIdsByMostRecentlyEdited: ["shot-i2v", "shot-a"],
        excludedShotIds: ["shot-i2v"]
      })
    ).toBe("shot-a");
  });

  it("keeps the last-viewed shot when a different shot is excluded", () => {
    expect(
      resolveDefaultShotId({
        lastViewedShotId: "shot-b",
        shotIdsByMostRecentlyEdited: ["shot-i2v", "shot-a", "shot-b"],
        excludedShotIds: ["shot-i2v"]
      })
    ).toBe("shot-b");
  });
});
