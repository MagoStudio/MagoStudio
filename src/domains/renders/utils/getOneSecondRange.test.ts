import { describe, expect, it } from "vitest";

import { getOneSecondRange } from "./getOneSecondRange";

describe("getOneSecondRange", () => {
  it("fits within the clip", () => {
    expect(
      getOneSecondRange({ start: 10, fps: 30, shotMaxFrames: 200 })
    ).toEqual([10, 39]);
  });

  it("shifts the start back when it would overflow the end", () => {
    expect(
      getOneSecondRange({ start: 190, fps: 30, shotMaxFrames: 200 })
    ).toEqual([171, 200]);
  });

  it("floors at 0 when the clip is shorter than one second", () => {
    expect(getOneSecondRange({ start: 0, fps: 30, shotMaxFrames: 20 })).toEqual(
      [0, 20]
    );
  });

  it("does not shift or truncate when the one-second duration exactly matches the clip length", () => {
    expect(getOneSecondRange({ start: 0, fps: 30, shotMaxFrames: 29 })).toEqual(
      [0, 29]
    );
  });

  it("holds exactly round(fps) frames rather than round(fps) + 1, when the clip has room to spare", () => {
    expect(getOneSecondRange({ start: 0, fps: 30, shotMaxFrames: 40 })).toEqual(
      [0, 29]
    );
  });

  it("rounds a fractional fps to a whole frame count", () => {
    expect(
      getOneSecondRange({ start: 0, fps: 23.976, shotMaxFrames: 200 })
    ).toEqual([0, 23]);
  });

  it("degenerates to a single-frame range at the current start when fps is 0 (shape check only — start + 0 is unaffected by the fix)", () => {
    expect(
      getOneSecondRange({ start: 10, fps: 0, shotMaxFrames: 200 })
    ).toEqual([10, 10]);
  });

  it("returns [NaN, NaN] when fps is undefined", () => {
    const result = getOneSecondRange({
      start: 10,
      fps: undefined as unknown as number,
      shotMaxFrames: 200
    });
    expect(result[0]).toBeNaN();
    expect(result[1]).toBeNaN();
  });
});
