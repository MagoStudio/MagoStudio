import { describe, expect, it } from "vitest";

import { buildCutShotVersionNumbers } from "./buildCutShotVersionNumbers";

describe("buildCutShotVersionNumbers", () => {
  it("numbers versions from the oldest, so the newest has the highest number", () => {
    const versionNumbers = buildCutShotVersionNumbers([
      { asset_id: "newest" },
      { asset_id: "middle" },
      { asset_id: "oldest" }
    ]);

    expect(versionNumbers.get("oldest")).toBe(1);
    expect(versionNumbers.get("middle")).toBe(2);
    expect(versionNumbers.get("newest")).toBe(3);
  });

  it("numbers nothing for a scene with no versions", () => {
    expect(buildCutShotVersionNumbers([]).size).toBe(0);
  });
});
