import { Layer } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { getMaskTrack } from "./getMaskTrack";

const tracks = [{ id: "track-a" }, { id: "track-b" }] as Layer[];

describe("getMaskTrack", () => {
  it("returns the track matching input_mask", () => {
    expect(getMaskTrack({ input_mask: "track-b" }, tracks)).toBe(tracks[1]);
  });

  it("returns undefined when input_mask is unset", () => {
    expect(getMaskTrack({}, tracks)).toBeUndefined();
  });

  it("returns undefined when input_mask is not a string", () => {
    expect(getMaskTrack({ input_mask: 3 }, tracks)).toBeUndefined();
  });

  it("returns undefined when no track matches", () => {
    expect(getMaskTrack({ input_mask: "missing" }, tracks)).toBeUndefined();
  });
});
