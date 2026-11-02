import { Layer } from "@schemas/layer";
import { describe, it, expect } from "vitest";

import { getTimelineOffset } from "./getTimelineOffset";

describe("getTimelineOffset", () => {
  it("returns the first clip's timeline offset", () => {
    const track: Partial<Layer> = {
      clips: [{ data: { timeline_offset: 20 } } as Layer["clips"][0]]
    };

    expect(getTimelineOffset(track as Layer)).toBe(20);
  });

  it("returns 0 when the offset is absent", () => {
    const track: Partial<Layer> = {
      clips: [{ data: {} } as Layer["clips"][0]]
    };

    expect(getTimelineOffset(track as Layer)).toBe(0);
  });

  it("returns 0 when there are no clips", () => {
    expect(getTimelineOffset({ clips: [] } as Partial<Layer> as Layer)).toBe(0);
  });

  it("returns 0 for null or undefined", () => {
    expect(getTimelineOffset(null)).toBe(0);
    expect(getTimelineOffset(undefined)).toBe(0);
  });
});
