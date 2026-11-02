import { describe, expect, it } from "vitest";

import { toCloudImageSize } from "./toCloudImageSize";

describe("toCloudImageSize", () => {
  it("returns the width and height cloud Mago registers", () => {
    expect(toCloudImageSize({ width: 1920, height: 1080 })).toEqual([
      1920, 1080
    ]);
  });

  it("rounds to the integers the backend parses", () => {
    expect(toCloudImageSize({ width: 511.6, height: 512.2 })).toEqual([
      512, 512
    ]);
  });

  it("refuses unknown dimensions instead of sending [0, 0]", () => {
    expect(toCloudImageSize({ width: null, height: null })).toBeNull();
    expect(toCloudImageSize({ width: 512, height: 0 })).toBeNull();
    expect(toCloudImageSize({ width: -1, height: 512 })).toBeNull();
  });
});
