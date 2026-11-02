import { describe, expect, it } from "vitest";

import { isCutShotVersionNew } from "./isCutShotVersionNew";

const finishedVersion = {
  asset_id: "take",
  ready: true,
  upscale_of: null,
  timeline_upscale_of: null
};

describe("isCutShotVersionNew", () => {
  it("counts a finished version nobody has played as new", () => {
    expect(isCutShotVersionNew(finishedVersion, new Set())).toBe(true);
  });

  it("does not count a played, unfinished or upscaled version as new", () => {
    expect(isCutShotVersionNew(finishedVersion, new Set(["take"]))).toBe(false);
    expect(
      isCutShotVersionNew({ ...finishedVersion, ready: false }, new Set())
    ).toBe(false);
    expect(
      isCutShotVersionNew(
        { ...finishedVersion, upscale_of: "source" },
        new Set()
      )
    ).toBe(false);
  });
});
