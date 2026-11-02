import { describe, expect, it } from "vitest";

import { buildShotZipEntryNames } from "./buildShotZipEntryNames";

describe("buildShotZipEntryNames", () => {
  it("names each entry after its Shot label with an .mp4 extension", () => {
    expect(buildShotZipEntryNames(["Shot_01", "Shot_02"])).toEqual([
      "Shot_01.mp4",
      "Shot_02.mp4"
    ]);
  });

  it("does not dedupe duplicate labels itself — zipBlobs owns uniqueness", () => {
    expect(buildShotZipEntryNames(["Shot_01", "Shot_01"])).toEqual([
      "Shot_01.mp4",
      "Shot_01.mp4"
    ]);
  });
});
