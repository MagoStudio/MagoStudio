import { Layer } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { getMaskRangeError } from "./getMaskRangeError";

const makeMaskTrack = (offset: number, duration: number): Layer =>
  ({
    id: "m1",
    name: "mask",
    clips: [
      {
        id: "c1",
        asset_id: "a1",
        asset: { id: "a1", name: "", data: { duration } },
        data: { timeline_offset: offset }
      }
    ]
  }) as unknown as Layer;

describe("getMaskRangeError", () => {
  it("returns not_in_range when mask ends before range starts", () => {
    const result = getMaskRangeError({
      maskTrack: makeMaskTrack(0, 10),
      rangeFrames: [20, 40]
    });
    expect(result).toEqual({
      kind: "not_in_range",
      maskFrames: [0, 10],
      rangeFrames: [20, 40]
    });
  });

  it("returns not_in_range when mask starts after range ends", () => {
    const result = getMaskRangeError({
      maskTrack: makeMaskTrack(50, 10),
      rangeFrames: [20, 40]
    });
    expect(result?.kind).toBe("not_in_range");
  });

  it("returns shorter_than_range when overlapping but mask is shorter", () => {
    const result = getMaskRangeError({
      maskTrack: makeMaskTrack(15, 10),
      rangeFrames: [10, 40]
    });
    expect(result).toEqual({
      kind: "shorter_than_range",
      maskFrames: [15, 25],
      rangeFrames: [10, 40]
    });
  });

  it("returns undefined when mask fully covers the range", () => {
    const result = getMaskRangeError({
      maskTrack: makeMaskTrack(0, 100),
      rangeFrames: [20, 40]
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when mask exactly equals the range", () => {
    const result = getMaskRangeError({
      maskTrack: makeMaskTrack(20, 20),
      rangeFrames: [20, 40]
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when mask track is missing", () => {
    expect(
      getMaskRangeError({ maskTrack: undefined, rangeFrames: [0, 10] })
    ).toBeUndefined();
  });

  it("skips validation when the mask track's first clip has not loaded yet", () => {
    const track = { id: "m1", name: "m", clips: [] } as unknown as Layer;
    const result = getMaskRangeError({
      maskTrack: track,
      rangeFrames: [0, 23]
    });
    expect(result).toBeUndefined();
  });

  it("treats a zero-duration mask as a legal single-frame range", () => {
    const result = getMaskRangeError({
      maskTrack: makeMaskTrack(10, 0),
      rangeFrames: [20, 40]
    });
    expect(result).toEqual({
      kind: "not_in_range",
      maskFrames: [10, 10],
      rangeFrames: [20, 40]
    });
  });

  it("returns undefined when the mask fully covers a single-frame render range", () => {
    expect(
      getMaskRangeError({
        maskTrack: makeMaskTrack(0, 100),
        rangeFrames: [40, 40]
      })
    ).toBeUndefined();
  });

  it("returns undefined when an inverted mask range is passed", () => {
    const track = {
      id: "m1",
      name: "mask",
      clips: [
        {
          id: "c1",
          asset_id: "a1",
          asset: { id: "a1", name: "", data: { duration: -5 } },
          data: { timeline_offset: 10 }
        }
      ]
    } as unknown as Layer;
    expect(
      getMaskRangeError({ maskTrack: track, rangeFrames: [0, 40] })
    ).toBeUndefined();
  });

  it("returns undefined when an inverted render range is passed", () => {
    expect(
      getMaskRangeError({
        maskTrack: makeMaskTrack(0, 100),
        rangeFrames: [40, 10]
      })
    ).toBeUndefined();
  });

  it("a mask ending on the render range's first frame overlaps by one frame", () => {
    const result = getMaskRangeError({
      maskTrack: makeMaskTrack(0, 10),
      rangeFrames: [10, 40]
    });
    expect(result?.kind).toBe("shorter_than_range");
  });

  it("a mask starting on the render range's last frame overlaps by one frame", () => {
    const result = getMaskRangeError({
      maskTrack: makeMaskTrack(40, 0),
      rangeFrames: [10, 40]
    });
    expect(result).toEqual({
      kind: "shorter_than_range",
      maskFrames: [40, 40],
      rangeFrames: [10, 40]
    });
  });

  it("a mask starting one frame past the render range's last frame does not overlap", () => {
    const result = getMaskRangeError({
      maskTrack: makeMaskTrack(41, 0),
      rangeFrames: [10, 40]
    });
    expect(result).toEqual({
      kind: "not_in_range",
      maskFrames: [41, 41],
      rangeFrames: [10, 40]
    });
  });

  it("a mask ending one frame before the range starts does not overlap", () => {
    const result = getMaskRangeError({
      maskTrack: makeMaskTrack(0, 9),
      rangeFrames: [10, 40]
    });
    expect(result?.kind).toBe("not_in_range");
  });

  it("a mask exactly as long as the range raises no error", () => {
    const result = getMaskRangeError({
      maskTrack: makeMaskTrack(0, 23),
      rangeFrames: [0, 23]
    });
    expect(result).toBeUndefined();
  });

  it("treats an overlapping mask of equal duration but shifted as not-shorter (priority: shorter check)", () => {
    const result = getMaskRangeError({
      maskTrack: makeMaskTrack(10, 20),
      rangeFrames: [20, 40]
    });
    expect(result).toBeUndefined();
  });
});
