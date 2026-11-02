import { Layer } from "@schemas/layer";
import { describe, it, expect } from "vitest";

import { frameRangeOf } from "./frameRangeOf";

const trackWith = (clip: Partial<Layer["clips"][0]> | undefined): Layer =>
  ({ clips: clip ? [clip as Layer["clips"][0]] : [] }) as Layer;

describe("frameRangeOf", () => {
  it("returns [offset, offset + duration]", () => {
    const track = trackWith({
      data: { timeline_offset: 20 },
      asset: { data: { duration: 60 } }
    } as Layer["clips"][0]);

    expect(frameRangeOf(track)).toEqual([20, 80]);
  });

  it("defaults offset to 0 when missing", () => {
    const track = trackWith({
      data: {},
      asset: { data: { duration: 20 } }
    } as Layer["clips"][0]);

    expect(frameRangeOf(track)).toEqual([0, 20]);
  });

  it("returns an empty range at the offset when duration is missing", () => {
    const track = trackWith({
      data: { timeline_offset: 10 },
      asset: { data: {} }
    } as Layer["clips"][0]);

    expect(frameRangeOf(track)).toEqual([10, 10]);
  });

  it("returns [0, 0] when there are no clips", () => {
    expect(frameRangeOf(trackWith(undefined))).toEqual([0, 0]);
  });
});
