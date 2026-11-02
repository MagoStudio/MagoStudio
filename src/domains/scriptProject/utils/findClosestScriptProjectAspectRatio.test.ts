import { describe, expect, it } from "vitest";

import { findClosestScriptProjectAspectRatio } from "./findClosestScriptProjectAspectRatio";

describe("findClosestScriptProjectAspectRatio", () => {
  it.each([
    [[768, 1368], "9:16"],
    [[1080, 1920], "9:16"],
    [[1368, 768], "16:9"],
    [[1024, 768], "4:3"],
    [[768, 1024], "3:4"],
    [[1080, 1080], "1:1"],
    [[1000, 1800], "9:16"]
  ] as const)("reads %j as %s", (outputSize, expectedRatioId) => {
    expect(
      findClosestScriptProjectAspectRatio([outputSize[0], outputSize[1]]).id
    ).toBe(expectedRatioId);
  });
});
