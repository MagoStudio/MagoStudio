import { describe, expect, it } from "vitest";

import { toDeliveredFrameRange } from "./toDeliveredFrameRange";

describe("toDeliveredFrameRange", () => {
  it("keeps a range whose inclusive length is what was delivered", () => {
    expect(toDeliveredFrameRange([10, 50], 41)).toEqual([10, 50]);
  });

  it("stretches the range to a video the backend snapped longer", () => {
    expect(toDeliveredFrameRange([0, 40], 56)).toEqual([0, 55]);
  });

  it("shrinks the range to a video that came back shorter", () => {
    expect(toDeliveredFrameRange([24, 120], 49)).toEqual([24, 72]);
  });

  it("has no range to align when the clip recorded none", () => {
    expect(toDeliveredFrameRange(undefined, 49)).toBeNull();
    expect(toDeliveredFrameRange([0.5, 10], 49)).toBeNull();
    expect(toDeliveredFrameRange([0, 10, 20], 49)).toBeNull();
  });
});
